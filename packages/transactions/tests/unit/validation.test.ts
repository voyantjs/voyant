import { describe, expect, it } from "vitest"

import {
  insertOfferSchema,
  insertOfferTravelerSchema,
  insertOrderTravelerSchema,
  offerMetadataSchema,
  storefrontOfferMetadataSchema,
} from "../../src/validation.js"

describe("transactions offer metadata validation", () => {
  it("accepts storefront promotional offer metadata on offers", () => {
    const parsed = insertOfferSchema.parse({
      offerNumber: "OFF-VALID-0001",
      title: "Spring promo",
      currency: "EUR",
      metadata: {
        storefrontPromotionalOffer: {
          slug: "spring-promo",
          description: "Seasonal campaign",
          discountType: "percentage",
          discountValue: "12",
          applicableProductIds: ["prod_123"],
          applicableDepartureIds: ["dep_456"],
          stackable: false,
        },
      },
    })

    expect(parsed.metadata).toMatchObject({
      storefrontPromotionalOffer: {
        enabled: true,
        slug: "spring-promo",
        description: "Seasonal campaign",
        discountType: "percentage",
        discountValue: "12",
        applicableProductIds: ["prod_123"],
        applicableDepartureIds: ["dep_456"],
        stackable: false,
      },
    })
  })

  it("rejects invalid storefront promotional offer metadata", () => {
    expect(() =>
      storefrontOfferMetadataSchema.parse({
        discountType: "bogus",
        discountValue: "10",
      }),
    ).toThrow()

    expect(() =>
      offerMetadataSchema.parse({
        storefrontPromotionalOffer: {
          discountType: "fixed_amount",
          discountValue: "",
        },
      }),
    ).toThrow()
  })

  it("rejects non-traveler participant types on traveler create schemas", () => {
    expect(() =>
      insertOfferTravelerSchema.parse({
        offerId: "ofr_123",
        firstName: "Guide",
        lastName: "Local",
        participantType: "staff",
      }),
    ).toThrow()

    expect(() =>
      insertOfferTravelerSchema.parse({
        offerId: "ofr_123",
        firstName: "Mihai",
        lastName: "Booker",
        participantType: "booker",
      }),
    ).toThrow()

    expect(() =>
      insertOrderTravelerSchema.parse({
        orderId: "ord_123",
        firstName: "Guide",
        lastName: "Local",
        participantType: "staff",
      }),
    ).toThrow()

    expect(() =>
      insertOrderTravelerSchema.parse({
        orderId: "ord_123",
        firstName: "Mihai",
        lastName: "Contact",
        participantType: "contact",
      }),
    ).toThrow()
  })
})
