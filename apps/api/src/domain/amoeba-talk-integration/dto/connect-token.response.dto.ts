export class ConnectTokenResponseDto {
  connectUrl: string
}

export class ConnectionStatusResponseDto {
  linked: boolean
  linkedAt?: string
  companyName?: string
}
