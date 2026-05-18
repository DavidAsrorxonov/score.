import { isIP } from "node:net";

import { UNSAFE_IPV4_RANGES, UNSAFE_IPV6_RANGES } from "./ip-ranges";

function stripIpv6Brackets(ip: string): string {
  if (ip.startsWith("[") && ip.endsWith("]")) {
    return ip.slice(1, -1);
  }

  return ip;
}

function parseIpv4ToNumber(ip: string): number | null {
  if (isIP(ip) !== 4) {
    return null;
  }

  const octets = ip.split(".").map((octet) => Number.parseInt(octet, 10));

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return null;
  }

  return (
    ((octets[0] << 24) >>> 0) +
    ((octets[1] << 16) >>> 0) +
    ((octets[2] << 8) >>> 0) +
    octets[3]
  );
}

function isIpv4InCidr(ip: string, base: string, prefixLength: number): boolean {
  const ipNumber = parseIpv4ToNumber(ip);
  const baseNumber = parseIpv4ToNumber(base);

  if (ipNumber === null || baseNumber === null) {
    return false;
  }

  const mask =
    prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0;

  return (ipNumber & mask) === (baseNumber & mask);
}

function embeddedIpv4ToHextets(ip: string): string {
  const lastColonIndex = ip.lastIndexOf(":");

  if (lastColonIndex === -1) {
    return ip;
  }

  const ipv4Part = ip.slice(lastColonIndex + 1);
  const ipv4Number = parseIpv4ToNumber(ipv4Part);

  if (ipv4Number === null) {
    return ip;
  }

  const high = ((ipv4Number >>> 16) & 0xffff).toString(16);
  const low = (ipv4Number & 0xffff).toString(16);

  return `${ip.slice(0, lastColonIndex)}:${high}:${low}`;
}

function parseIpv6ToBigInt(ip: string): bigint | null {
  const cleanIp = stripIpv6Brackets(ip).split("%", 1)[0].toLowerCase();

  if (isIP(cleanIp) !== 6) {
    return null;
  }

  const normalizedIp = embeddedIpv4ToHextets(cleanIp);
  const compressionParts = normalizedIp.split("::");

  if (compressionParts.length > 2) {
    return null;
  }

  const left = compressionParts[0]
    ? compressionParts[0].split(":").filter(Boolean)
    : [];
  const right = compressionParts[1]
    ? compressionParts[1].split(":").filter(Boolean)
    : [];
  const missingGroupCount =
    compressionParts.length === 2 ? 8 - left.length - right.length : 0;

  if (missingGroupCount < 0) {
    return null;
  }

  const hextets =
    compressionParts.length === 2
      ? [...left, ...Array<string>(missingGroupCount).fill("0"), ...right]
      : [...left, ...right];

  if (hextets.length !== 8) {
    return null;
  }

  return hextets.reduce<bigint | null>((value, hextet) => {
    if (!/^[0-9a-f]{1,4}$/i.test(hextet) || value === null) {
      return null;
    }

    return (value << BigInt(16)) + BigInt(Number.parseInt(hextet, 16));
  }, BigInt(0));
}

function isIpv6InCidr(ip: string, base: string, prefixLength: number): boolean {
  const ipValue = parseIpv6ToBigInt(ip);
  const baseValue = parseIpv6ToBigInt(base);

  if (ipValue === null || baseValue === null) {
    return false;
  }

  if (prefixLength === 0) {
    return true;
  }

  const shift = BigInt(128 - prefixLength);

  return ipValue >> shift === baseValue >> shift;
}

function getMappedIpv4Address(ip: string): string | null {
  const cleanIp = stripIpv6Brackets(ip).toLowerCase();

  const mappedAddress = cleanIp.startsWith("::ffff:")
    ? cleanIp.slice("::ffff:".length)
    : null;

  if (mappedAddress !== null && isIP(mappedAddress) === 4) {
    return mappedAddress;
  }

  const ipValue = parseIpv6ToBigInt(cleanIp);
  const mappedPrefix = parseIpv6ToBigInt("::ffff:0:0");

  if (ipValue === null || mappedPrefix === null) {
    return null;
  }

  if (ipValue >> BigInt(32) !== mappedPrefix >> BigInt(32)) {
    return null;
  }

  const mappedNumber = Number(ipValue & BigInt(0xffffffff));

  return [
    (mappedNumber >>> 24) & 0xff,
    (mappedNumber >>> 16) & 0xff,
    (mappedNumber >>> 8) & 0xff,
    mappedNumber & 0xff,
  ].join(".");
}

export function isUnsafeIpAddress(ip: string): boolean {
  const cleanIp = stripIpv6Brackets(ip);
  const ipVersion = isIP(cleanIp);

  if (ipVersion === 4) {
    return UNSAFE_IPV4_RANGES.some((range) =>
      isIpv4InCidr(cleanIp, range.base, range.prefixLength),
    );
  }

  if (ipVersion === 6) {
    const mappedIpv4Address = getMappedIpv4Address(cleanIp);

    if (mappedIpv4Address !== null && isUnsafeIpAddress(mappedIpv4Address)) {
      return true;
    }

    return UNSAFE_IPV6_RANGES.some((range) =>
      isIpv6InCidr(cleanIp, range.base, range.prefixLength),
    );
  }

  return false;
}
