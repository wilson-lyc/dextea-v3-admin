import path from 'node:path'
import { credentials, loadPackageDefinition, Metadata, type ChannelCredentials, type Client } from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { config } from '@/config.js'
import { resolveServiceAddress } from '@/infrastructure/nacos.js'

export type RpcService = 'productAdmin' | 'productBusiness' | 'storeAdmin' | 'storeBusiness' | 'storeCredential' | 'tradeAdmin' | 'xos'

interface RpcDefinition {
  packagePath: string
  serviceName: string
  protoPath: string
}

const definitions: Record<RpcService, RpcDefinition> = {
  productAdmin: {
    packagePath: 'dextea.product.v1',
    serviceName: 'ProductAdminService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/product/v1/product.proto'),
  },
  productBusiness: {
    packagePath: 'dextea.product.v1',
    serviceName: 'ProductBusinessService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/product/v1/product.proto'),
  },
  storeAdmin: {
    packagePath: 'dextea.store.v1',
    serviceName: 'StoreAdminService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/store/v1/store.proto'),
  },
  storeBusiness: {
    packagePath: 'dextea.store.v1',
    serviceName: 'StoreBusinessService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/store/v1/store.proto'),
  },
  storeCredential: {
    packagePath: 'dextea.store.v1',
    serviceName: 'StoreCredentialService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/store/v1/store.proto'),
  },
  tradeAdmin: {
    packagePath: 'dextea.order.v1',
    serviceName: 'OrderAdminService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/order/v1/order.proto'),
  },
  xos: {
    packagePath: 'xos.v1',
    serviceName: 'XOSService',
    protoPath: path.resolve(process.cwd(), '../../../dextea-proto/proto/xos/v1/xos.proto'),
  },
}

function serviceConfig(service: RpcService): { serviceName: string; address: string } {
  switch (service) {
    case 'productAdmin':
    case 'productBusiness': return { serviceName: config.rpc.productServiceName, address: config.rpc.productAddress }
    case 'storeAdmin':
    case 'storeBusiness':
    case 'storeCredential': return { serviceName: config.rpc.storeServiceName, address: config.rpc.storeAddress }
    case 'tradeAdmin': return { serviceName: config.rpc.tradeServiceName, address: config.rpc.tradeAddress }
    case 'xos': return { serviceName: config.rpc.xosServiceName, address: config.rpc.xosAddress }
  }
}

export async function createRpcClient(service: RpcService): Promise<Client> {
  const definition = definitions[service]
  const target = serviceConfig(service)
  const address = config.nacos.enabled
    ? await resolveServiceAddress(target.serviceName, target.address)
    : target.address
  const packageDefinition = protoLoader.loadSync(definition.protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  })
  const packages = loadPackageDefinition(packageDefinition) as unknown as Record<string, unknown>
  const namespace = packages[service === 'xos' ? 'xos' : 'dextea'] as Record<string, unknown>
  const packageName = service === 'tradeAdmin'
    ? 'order'
    : service.startsWith('store')
      ? 'store'
      : service.startsWith('product')
        ? 'product'
        : service
  const servicePackage = namespace[packageName] as Record<string, unknown>
  const version = servicePackage.v1 as Record<string, unknown>
  const Service = version[definition.serviceName] as new (
    address: string,
    credentials: ChannelCredentials,
  ) => Client
  return new Service(address, credentials.createInsecure())
}

const clients = new Map<RpcService, Promise<Client>>()

export async function callRpc<TResponse>(
  service: RpcService,
  method: string,
  request: Record<string, unknown>,
): Promise<TResponse> {
  let clientPromise = clients.get(service)
  if (!clientPromise) {
    clientPromise = createRpcClient(service)
    clients.set(service, clientPromise)
  }
  const client = await clientPromise
  const rpcMethod = (client as unknown as Record<string, unknown>)[method] as
    | ((input: Record<string, unknown>, metadata: Metadata, callback: (error: Error | null, response: TResponse) => void) => void)
    | undefined
  if (!rpcMethod) throw new Error(`RPC 方法不存在: ${service}.${method}`)
  const metadata = new Metadata()
  const serviceToken = service === 'productAdmin'
    ? config.rpc.productAdminServiceToken
    : service === 'productBusiness'
      ? config.rpc.productBusinessServiceToken
      : service === 'storeAdmin'
        ? config.rpc.storeAdminServiceToken
        : service === 'storeBusiness'
          ? config.rpc.storeBusinessServiceToken
          : service === 'storeCredential'
            ? config.rpc.storeCredentialServiceToken
            : ''
  if (serviceToken) metadata.set('x-service-token', serviceToken)
  return new Promise<TResponse>((resolve, reject) => {
    rpcMethod.call(client, request, metadata, (error, response) => error ? reject(error) : resolve(response))
  })
}
