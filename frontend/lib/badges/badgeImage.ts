
const IMAGE_FOLDER_CID =
  "bafybeibquietwcoouud25hafbqpij5yhor3gnb4doigx47olarrzholyui";

const BADGE_FILENAMES: Record<string, string> = {
  "what-is-gooddollar": "badge-1.png",
  "daily-ubi-claim": "badge-2.png",
  "face-verification": "badge-3.png",
  "good-id-offers": "badge-4.png",
  "reserve-mechanics": "badge-5.png",
  "gas-sponsorship": "badge-6.png",
  "wallet-keys": "badge-7.png",
  "spotting-scams-in-the-wild": "badge-8.png",

  // Level milestones (uploaded later — pointing at placeholders for now)
  "level-25": "level-25.png",
  "level-50": "level-50.png",
  "level-100": "level-100.png",
};

export function getBadgeImageIpfs(slug: string): string | null {
  const filename = BADGE_FILENAMES[slug];
  if (!filename) return null;
  return `ipfs://${IMAGE_FOLDER_CID}/${filename}`;
}


export function ipfsToGateway(uri: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`;
  }
  return uri;
}


export function getBadgeImageUrl(slug: string): string | null {
  return ipfsToGateway(getBadgeImageIpfs(slug));
}
