export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const convertResourcesStringToNumber = (resource: string) => {
  return parseInt(resource.replace(/\D/g, ''), 10);
};
