import { LookupError, StopID, toStopID } from "melbpt-utils";
import { domDiv, domP } from "../../utils/dom-utils";
import {
  BranchLineGraphNode, CityLoopLineGraphNode, LineGraph, RegularLineGraphNode
} from "../../utils/line-diagram/line-graph";

export const dummyLineGraph = new LineGraph(
  new CityLoopLineGraphNode("richmond", "clockwise",
    new RegularLineGraphNode(toStopID(224),
      new RegularLineGraphNode(toStopID(252),
        new RegularLineGraphNode(toStopID(53),
          new RegularLineGraphNode(toStopID(211),
            new RegularLineGraphNode(toStopID(59),
              new RegularLineGraphNode(toStopID(299),
                new BranchLineGraphNode(toStopID(74),
                  new RegularLineGraphNode(toStopID(174),
                    new RegularLineGraphNode(toStopID(69), null)
                  ),
                  new RegularLineGraphNode(toStopID(31),
                    new RegularLineGraphNode(toStopID(214), null)
                  ),
                )
              )
            )
          )
        )
      )
    )
  )
);

export const dummyDetailer = (stop: StopID, insetLevel: number) => {
  const insetRem = 2.5 + insetLevel * 1.5;

  const regular = (name: string) => {
    const $stopName = domP(name, "dummy-stop-name");

    const $details = domDiv("dummy-stop dummy-stop-regular");
    $details.style.paddingLeft = `${insetRem}rem`;
    $details.append($stopName);

    return $details;
  };

  const interchange = (name: string, changeMessage: string) => {
    const $stopName = domP(name, "dummy-stop-name");
    const $changeMessage = domP(changeMessage, "dummy-change-message");

    const $details = domDiv("dummy-stop dummy-stop-interchange");
    $details.style.paddingLeft = `${insetRem}rem`;
    $details.append($stopName, $changeMessage);

    return $details;
  };

  const result = {
    9999: regular("City Loop"),
    104: regular("Flinders Street"),
    253: regular("Southern Cross"),
    101: regular("Flagstaff"),
    171: regular("Melbourne Central"),
    216: interchange("Parliament",
      "Change here for Hurstbridge and Mernda services"),
    224: interchange("Richmond",
      "Change here for Alamein, Belgrave, Glen Waverley, and Lilydale services"),
    252: interchange("South Yarra", "Change here for Sandringham services"),
    53: interchange("Caulfield", "Change here for Frankston services"),
    211: regular("Oakleigh"),
    59: regular("Clayton"),
    299: regular("Westall"),
    74: regular("Dandenong"),
    174: regular("Merinda Park"),
    69: regular("Cranbourne"),
    31: regular("Berwick"),
    214: regular("Pakenham")
  }[stop as number];

  if (result == undefined) {
    throw new LookupError("ASEHFGUSEHOIWAJI");
  }

  return result;
};
