/**
 * Defines a grouping of departures as seen on a stop's main page.
 */
export type DepartureGroup = {
  filter: string,
  count: number,
  title: string,
  subtitle: string | null
};

const flindersStreet = 104;
const southernCross = 253;
const melbourneCentral = 171;
const parliament = 216;
const flagstaff = 101;

/**
 * Returns the appropriate departures groups to use for this stop. Some stops
 * use different groups to others, e.g. the city loop stations.
 * @param stopID The stop's ID.
 */
export function determineDepartureGroups(stopID: number): DepartureGroup[] {
  // Flinders Street just has one big list (unless I can think of a nicer way
  // of organizing them).
  if (stopID == flindersStreet) {
    return [{
      filter: "",
      count: 10,
      title: "All trains",
      subtitle: null
    }];
  }

  // Southern Cross splits by regional vs metro.
  if (stopID == southernCross) {
    return [
      {
        filter: "service-regional",
        count: 5,
        title: "Regional trains",
        subtitle: null
      },
      {
        filter: "service-suburban",
        count: 5,
        title: "Suburban trains",
        subtitle: null
      }
    ];
  }

  // Undergroup city loop stations are split by platform.
  if ([flagstaff, melbourneCentral, parliament].includes(stopID)) {
    return [
      {
        filter: "platform-1",
        count: 3,
        title: "Platform 1",
        subtitle: "Hurstbridge, Mernda lines"
      },
      {
        filter: "platform-2",
        count: 3,
        title: "Platform 2",
        subtitle: "Cranbourne, Pakenham lines"
      },
      {
        filter: "platform-3",
        count: 3,
        title: "Platform 3",
        subtitle: "Craigeburn, Sunbury, Upfield lines"
      },
      {
        filter: "platform-4",
        count: 3,
        title: "Platform 4",
        subtitle: "Alamein, Belgrave, Glen Waverley, Lilydale lines"
      }
    ];
  }

  // Every other station is split by up vs down.
  return [
    {
      filter: "up",
      count: 5,
      title: "Citybound trains",
      subtitle: null
    },
    {
      filter: "down",
      count: 5,
      title: "Outbound trains",
      subtitle: null
    }
  ];
}
