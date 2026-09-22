export type BrandId = "cdw" | "softwareone";

export type Brand = {
  id: BrandId;
  partnerName: string;
  productName: string;
  mark: string;
  accent: string;
  accentDark: string;
  emailIntro: string;
  artifactIntro: string;
  signoff: string;
};

export function withBrandPeople(brand: Brand) {
  return {
    facilitatorOrg: brand.partnerName,
    sponsorLine: `Tom Brennan · ${brand.partnerName} AI & Data Practice Lead`,
    signoff: `Ravi Menon · ${brand.partnerName}`,
  };
}

export const brands: Record<BrandId, Brand> = {
  cdw: {
    id: "cdw",
    partnerName: "CDW",
    productName: "Value session",
    mark: "CDW",
    accent: "#cc1827",
    accentDark: "#a70f1c",
    emailIntro: "We’ll keep the session practical and grounded in Heartland’s operating reality.",
    artifactIntro: "Prepared by CDW with Heartland Mutual Insurance",
    signoff: "Ravi Menon · CDW",
  },
  softwareone: {
    id: "softwareone",
    partnerName: "SoftwareOne",
    productName: "Value session",
    mark: "softwareone",
    accent: "#c84318",
    accentDark: "#c84318",
    emailIntro: "Together, we’ll turn Heartland’s operational friction into a focused, measurable pilot.",
    artifactIntro: "A SoftwareOne Value Lab brief for Heartland Mutual Insurance",
    signoff: "Ravi Menon · SoftwareOne",
  },
};
