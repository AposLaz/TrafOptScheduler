import kialiApi from "../api/kiali/kialiApi";
import { createLinksForSourceAndTarget } from "../api/kiali/services";

export const setUpTraffic = async () => {
  //do that for each namespace
  const ns = "online-boutique";
  const getKialiGraph = await kialiApi.getGraph(ns);
  if (!getKialiGraph) return;

  await createLinksForSourceAndTarget(getKialiGraph, ns);
};
