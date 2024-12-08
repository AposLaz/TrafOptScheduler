import { KialiService } from './kiali/kiali';

export class IstioManager {
  private kiali = new KialiService();
  async getAppsGraph(namespace: string) {
    const kialiGraph = await this.kiali.getKialiGraph(namespace);
    if (!kialiGraph) return;

    console.log(kialiGraph);
  }
}
