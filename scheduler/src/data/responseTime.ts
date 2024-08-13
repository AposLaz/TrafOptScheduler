export const kialiRS = {
  timestamp: 1723519791,
  duration: 600,
  graphType: 'workload',
  elements: {
    nodes: [
      {
        data: {
          id: '9f165cb8e844b24136f1069428b28bfd',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'adservice',
          app: 'adservice',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'adservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '6.18',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: 'e5e576dcf6abacdcc544e5c72bcc5937',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'cartservice',
          app: 'cartservice',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'cartservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '9.96',
              },
            },
            {
              protocol: 'tcp',
              rates: {
                tcpOut: '1267.73',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: 'fa110595c339cc42bd5b27026af19de2',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'checkoutservice',
          app: 'checkoutservice',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'checkoutservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '0.37',
                grpcInErr: '0.37',
                grpcOut: '6.23',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: 'c511d792e467b693f7d7ba2dfead27b4',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'currencyservice',
          app: 'currencyservice',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'currencyservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '26.65',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: 'de3d5e073468f22ccd124f6e1e425ab8',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'frontend',
          app: 'frontend',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'frontend',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcOut: '56.86',
              },
            },
            {
              protocol: 'http',
              rates: {
                httpIn: '10.76',
                httpIn3xx: '1.97',
                httpIn5xx: '2.61',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: 'd2d12bd40386a4ef09d98cd1f6339283',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'loadgenerator',
          app: 'loadgenerator',
          version: 'latest',
          traffic: [
            {
              protocol: 'http',
              rates: {
                httpOut: '10.76',
              },
            },
          ],
          healthData: null,
          isRoot: true,
        },
      },
      {
        data: {
          id: '63ca622690cbae865900124a56db46c7',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'productcatalogservice',
          app: 'productcatalogservice',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'productcatalogservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '10.08',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: '75c75790d8136439466ad58be6a04951',
          nodeType: 'workload',
          cluster: 'Kubernetes',
          namespace: 'online-boutique',
          workload: 'redis-cart',
          app: 'redis-cart',
          version: 'latest',
          destServices: [
            {
              cluster: 'Kubernetes',
              namespace: 'online-boutique',
              name: 'redis-cart',
            },
          ],
          traffic: [
            {
              protocol: 'tcp',
              rates: {
                tcpIn: '1267.73',
              },
            },
          ],
          healthData: null,
        },
      },
      {
        data: {
          id: 'a95f7ead2c0c04e3bd58404a0e6e8ec6',
          nodeType: 'service',
          cluster: 'unknown',
          namespace: 'unknown',
          service: 'recommendationservice',
          destServices: [
            {
              cluster: 'unknown',
              namespace: 'unknown',
              name: 'recommendationservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '7.25',
                grpcInErr: '7.25',
              },
            },
          ],
          healthData: null,
          isInaccessible: true,
        },
      },
      {
        data: {
          id: 'b375fd8be34121c9abdee649086f3030',
          nodeType: 'service',
          cluster: 'unknown',
          namespace: 'unknown',
          service: 'shippingservice',
          destServices: [
            {
              cluster: 'unknown',
              namespace: 'unknown',
              name: 'shippingservice',
            },
          ],
          traffic: [
            {
              protocol: 'grpc',
              rates: {
                grpcIn: '2.61',
                grpcInErr: '2.61',
              },
            },
          ],
          healthData: null,
          isInaccessible: true,
        },
      },
    ],
    edges: [
      {
        data: {
          id: 'e357fc842c4a9f7af5bd25de625a89e1',
          source: 'd2d12bd40386a4ef09d98cd1f6339283',
          target: 'de3d5e073468f22ccd124f6e1e425ab8',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/frontend',
          isMTLS: '100',
          responseTime: '42',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/loadgenerator',
          throughput: '78560',
          traffic: {
            protocol: 'http',
            rates: {
              http: '10.76',
              http3xx: '1.97',
              http5xx: '2.61',
              httpPercentErr: '24.3',
              httpPercentReq: '100.0',
            },
            responses: {
              '200': {
                flags: {
                  '-': '57.4',
                },
                hosts: {
                  'frontend.online-boutique.svc.cluster.local': '57.4',
                },
              },
              '302': {
                flags: {
                  '-': '18.3',
                },
                hosts: {
                  'frontend.online-boutique.svc.cluster.local': '18.3',
                },
              },
              '500': {
                flags: {
                  '-': '24.3',
                },
                hosts: {
                  'frontend.online-boutique.svc.cluster.local': '24.3',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '0b8749fdcad6084329fca7c3dc112647',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: '63ca622690cbae865900124a56db46c7',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/productcatalogservice',
          isMTLS: '100',
          responseTime: '0',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/frontend',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '7.34',
              grpcPercentReq: '12.9',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'productcatalogservice.online-boutique.svc.cluster.local':
                    '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '5113ba3cf0b744d33809080129fadc0a',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: '9f165cb8e844b24136f1069428b28bfd',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/adservice',
          isMTLS: '100',
          responseTime: '5',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/frontend',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '6.18',
              grpcPercentReq: '10.9',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'adservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: 'd39c37487bd619b4955c8ea2d34580ad',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: 'a95f7ead2c0c04e3bd58404a0e6e8ec6',
          responseTime: '0',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '7.25',
              grpcErr: '7.25',
              grpcPercentErr: '100.0',
              grpcPercentReq: '12.8',
            },
            responses: {
              '14': {
                flags: {
                  UH: '100.0',
                },
                hosts: {
                  'recommendationservice.online-boutique.svc.cluster.local':
                    '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '033844efb1d1a1b17770d26ddd64e355',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: 'b375fd8be34121c9abdee649086f3030',
          responseTime: '0',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '2.23',
              grpcErr: '2.23',
              grpcPercentErr: '100.0',
              grpcPercentReq: '3.9',
            },
            responses: {
              '14': {
                flags: {
                  UH: '100.0',
                },
                hosts: {
                  'shippingservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '1b0b299e83414e40c38bca4d1f5ed979',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: 'c511d792e467b693f7d7ba2dfead27b4',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/currencyservice',
          isMTLS: '100',
          responseTime: '5',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/frontend',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '23.90',
              grpcPercentReq: '42.0',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'currencyservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '5abd1b8daef0381d8e971a6d5ec3d2e7',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: 'e5e576dcf6abacdcc544e5c72bcc5937',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/cartservice',
          isMTLS: '100',
          responseTime: '5',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/frontend',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '9.58',
              grpcPercentReq: '16.9',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'cartservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '742fc0c921c59c01df4077fa30ecbc63',
          source: 'de3d5e073468f22ccd124f6e1e425ab8',
          target: 'fa110595c339cc42bd5b27026af19de2',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/checkoutservice',
          isMTLS: '100',
          responseTime: '49',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/frontend',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '0.37',
              grpcErr: '0.37',
              grpcPercentErr: '100.0',
              grpcPercentReq: '0.7',
            },
            responses: {
              '13': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'checkoutservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '308db5be3fec8f647b88c88a977634d8',
          source: 'e5e576dcf6abacdcc544e5c72bcc5937',
          target: '75c75790d8136439466ad58be6a04951',
          destPrincipal: 'spiffe://cluster.local/ns/online-boutique/sa/default',
          isMTLS: '100',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/cartservice',
          traffic: {
            protocol: 'tcp',
            rates: {
              tcp: '1267.73',
            },
            responses: {
              '-': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'redis-cart.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '94f0c86bb987353d02c27cb9df9874ab',
          source: 'fa110595c339cc42bd5b27026af19de2',
          target: '63ca622690cbae865900124a56db46c7',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/productcatalogservice',
          isMTLS: '100',
          responseTime: '0',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/checkoutservice',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '2.74',
              grpcPercentReq: '43.9',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'productcatalogservice.online-boutique.svc.cluster.local':
                    '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '127d0fb5706993ae9621b970eedb730d',
          source: 'fa110595c339cc42bd5b27026af19de2',
          target: 'b375fd8be34121c9abdee649086f3030',
          responseTime: '0',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '0.37',
              grpcErr: '0.37',
              grpcPercentErr: '100.0',
              grpcPercentReq: '6.0',
            },
            responses: {
              '14': {
                flags: {
                  UH: '100.0',
                },
                hosts: {
                  'shippingservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '69eded202e83b146197f0b41a34dd65c',
          source: 'fa110595c339cc42bd5b27026af19de2',
          target: 'c511d792e467b693f7d7ba2dfead27b4',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/currencyservice',
          isMTLS: '100',
          responseTime: '4',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/checkoutservice',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '2.75',
              grpcPercentReq: '44.1',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'currencyservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
      {
        data: {
          id: '9626e888a6bf9f560a16f6ab3295f76f',
          source: 'fa110595c339cc42bd5b27026af19de2',
          target: 'e5e576dcf6abacdcc544e5c72bcc5937',
          destPrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/cartservice',
          isMTLS: '100',
          responseTime: '5',
          sourcePrincipal:
            'spiffe://cluster.local/ns/online-boutique/sa/checkoutservice',
          traffic: {
            protocol: 'grpc',
            rates: {
              grpc: '0.37',
              grpcPercentReq: '6.0',
            },
            responses: {
              '0': {
                flags: {
                  '-': '100.0',
                },
                hosts: {
                  'cartservice.online-boutique.svc.cluster.local': '100.0',
                },
              },
            },
          },
        },
      },
    ],
  },
};
