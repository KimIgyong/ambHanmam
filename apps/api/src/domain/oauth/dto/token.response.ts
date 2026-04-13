export class TokenResponseDto {
  access_token: string;
  token_type: string; // 'Bearer'
  expires_in: number; // seconds
  refresh_token?: string;
  scope: string; // space-delimited
}
