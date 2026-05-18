export interface IpCidrRange {
  base: string;
  prefixLength: number;
}

export const UNSAFE_IPV4_RANGES: IpCidrRange[] = [
  { base: "0.0.0.0", prefixLength: 8 },
  { base: "10.0.0.0", prefixLength: 8 },
  { base: "100.64.0.0", prefixLength: 10 },
  { base: "127.0.0.0", prefixLength: 8 },
  { base: "169.254.0.0", prefixLength: 16 },
  { base: "172.16.0.0", prefixLength: 12 },
  { base: "192.0.0.0", prefixLength: 24 },
  { base: "192.0.2.0", prefixLength: 24 },
  { base: "192.168.0.0", prefixLength: 16 },
  { base: "198.18.0.0", prefixLength: 15 },
  { base: "198.51.100.0", prefixLength: 24 },
  { base: "203.0.113.0", prefixLength: 24 },
  { base: "224.0.0.0", prefixLength: 4 },
  { base: "240.0.0.0", prefixLength: 4 },
  { base: "255.255.255.255", prefixLength: 32 },
];

export const UNSAFE_IPV6_RANGES: IpCidrRange[] = [
  { base: "::1", prefixLength: 128 },
  { base: "::", prefixLength: 128 },
  { base: "fc00::", prefixLength: 7 },
  { base: "fe80::", prefixLength: 10 },
  { base: "ff00::", prefixLength: 8 },
  { base: "2001:db8::", prefixLength: 32 },
];
