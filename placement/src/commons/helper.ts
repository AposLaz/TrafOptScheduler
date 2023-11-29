export const createArrayFromStringWithNewLine = (str: string) => {
  const arrayVal = str.trim().split("\n");
  return arrayVal;
};

export const createArrayFromStringWithSpace = (str: string) => {
  const arrayVal = str.trim().split(" ");
  return arrayVal;
};

export const convertCPUtoCores = (cpu: string): number => {
  const cpuNumber = Number(cpu.slice(0, -1));
  const divCPU = cpuNumber / 1000;
  return divCPU;
};

export const convertRAMtoGB = (ram: string): number => {
  const ramNumber = Number(ram.slice(0, -2));
  const divRAM = ramNumber / 1024;
  return divRAM;
};
