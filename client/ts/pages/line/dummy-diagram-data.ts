import { LookupError, StopID, toStopID } from "melbpt-utils";
import { domDiv, domP } from "../../utils/dom-utils";
import { LineGraph, LineGraphBranches, LineGraphCityLoop, LineGraphStop }
  from "../../utils/line-diagram/line-graph";

export const dummyLineGraph = new LineGraph(
  [
    new LineGraphStop(toStopID(224), false),
    new LineGraphStop(toStopID(252), false),
    new LineGraphStop(toStopID(126), false),
    new LineGraphStop(toStopID(274), false),
    new LineGraphStop(toStopID(10), false),
    new LineGraphStop(toStopID(167), false),
    new LineGraphStop(toStopID(53), false),
    new LineGraphStop(toStopID(49), false),
    new LineGraphStop(toStopID(195), false),
    new LineGraphStop(toStopID(137), false),
    new LineGraphStop(toStopID(211), false),
    new LineGraphStop(toStopID(138), false),
    new LineGraphStop(toStopID(59), false),
    new LineGraphStop(toStopID(299), false),
    new LineGraphStop(toStopID(257), false),
    new LineGraphStop(toStopID(239), false),
    new LineGraphStop(toStopID(201), false),
    new LineGraphStop(toStopID(312), false),
    new LineGraphStop(toStopID(74), false)
  ],
  new LineGraphCityLoop("richmond", "anticlockwise"),
  new LineGraphBranches(
    [
      new LineGraphStop(toStopID(162), false),
      new LineGraphStop(toStopID(174), false),
      new LineGraphStop(toStopID(69), false)
    ],
    [
      new LineGraphStop(toStopID(122), false),
      new LineGraphStop(toStopID(198), false),
      new LineGraphStop(toStopID(31), false),
      new LineGraphStop(toStopID(24), false),
      new LineGraphStop(toStopID(212), false),
      new LineGraphStop(toStopID(48), false),
      new LineGraphStop(toStopID(214), false)
    ]
  )
);

export const dummyDetailer = (stop: StopID, _express: boolean, insetRem: number) => {
  const regular = (name: string) => {
    const $stopName = domP(name, "dummy-stop-name");

    const $details = domDiv("dummy-stop dummy-stop-regular");
    $details.style.paddingLeft = `${(2.5 + insetRem)}rem`;
    $details.append($stopName);

    return $details;
  };

  const interchange = (name: string, changeMessage: string) => {
    const $stopName = domP(name, "dummy-stop-name");
    const $changeMessage = domP(changeMessage, "dummy-change-message");

    const $details = domDiv("dummy-stop dummy-stop-interchange");
    $details.style.paddingLeft = `${(2.5 + insetRem)}rem`;
    $details.append($stopName, $changeMessage);

    return $details;
  };

  const result = {
    104: regular("Flinders Street"),
    253: regular("Southern Cross"),
    101: regular("Flagstaff"),
    171: regular("Melbourne Central"),
    216: interchange("Parliament",
      "Change here for Hurstbridge and Mernda services"),
    224: interchange("Richmond",
      "Change here for Alamein, Belgrave, Glen Waverley, and Lilydale services"),
    252: interchange("South Yarra", "Change here for Sandringham services"),
    126: regular("Hawksburn"),
    274: regular("Toorak"),
    10: regular("Armadale"),
    167: regular("Malvern"),
    53: interchange("Caulfield", "Change here for Frankston services"),
    49: regular("Carnegie"),
    195: regular("Murrumbeena"),
    137: regular("Hughesdale"),
    211: regular("Oakleigh"),
    138: regular("Huntingdale"),
    59: regular("Clayton"),
    299: regular("Westall"),
    257: regular("Springvale"),
    239: regular("Sandown Park"),
    201: regular("Noble Park"),
    312: regular("Yarraman"),
    74: regular("Dandenong"),
    162: regular("Lynbrook"),
    174: regular("Merinda Park"),
    69: regular("Cranbourne"),
    122: regular("Hallam"),
    198: regular("Narre Warren"),
    31: regular("Berwick"),
    24: regular("Beaconsfield"),
    212: regular("Officer"),
    48: regular("Cardinia Road"),
    214: regular("Pakenham")
  }[stop as number];

  if (result == undefined) {
    throw new LookupError("ASEHFGUSEHOIWAJI");
  }

  return result;
};
