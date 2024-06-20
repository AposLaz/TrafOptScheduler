import { AppLinksGraphAvgPropAndAffinities } from './types';

export const updateMembershipMatrix = (
  graphData: AppLinksGraphAvgPropAndAffinities
) => {
  //console.log(JSON.stringify(graphData, null, 2));

  graphData.appLinks.forEach((link) => {
    const newP: { [key: string]: number } = {};

    // Gradient Descent Step
    const currentCommunitiesProb = link.communitiesProb[0];

    for (const com in currentCommunitiesProb) {
      newP[com] = currentCommunitiesProb[com];
    }
    console.log(`********** ${link.source} *********`);
    console.log(newP);
  });
};
