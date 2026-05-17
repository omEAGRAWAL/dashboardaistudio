# Seamless T&C Integration in UnifiedBookingForm

This plan aims to integrate the Terms & Conditions (T&C) logic directly into the `UnifiedBookingForm` component. This will simplify the parent pages and ensure a consistent user experience regardless of how many steps or pages the booking form has.

## User Review Required

> [!IMPORTANT]
> The T&C checkbox will now appear automatically on the **last page** of the booking form if enabled in settings. This ensures the user agrees to the terms just before submitting their final details.

## Proposed Changes

### [UnifiedBookingForm Component](file:///c:/Users/OmAgrawal/Downloads/dashboardaistudio/components/UnifiedBookingForm.tsx)

#### [MODIFY] [UnifiedBookingForm.tsx](file:///c:/Users/OmAgrawal/Downloads/dashboardaistudio/components/UnifiedBookingForm.tsx)
- Add `termsConfig` prop: `{ enabled: boolean; mandatory: boolean; content: string }`.
- Add internal state `termsAccepted` (boolean) and `termsModalOpen` (boolean).
- Implement a `TermsModal` sub-component or inline logic within the form to show the T&C content.
- Render the T&C checkbox and "Read More" link on the last page of the form.
- Update `handleNext` to:
    - Validate `termsAccepted` if `termsEnabled` and `termsMandatory` are true on the last page.
    - Change button text on the last page from "Next" to "Complete Booking" (or configurable).

---

### [Campaign Page](file:///c:/Users/OmAgrawal/Downloads/dashboardaistudio/app/campaign/[orgId]/page.tsx)

#### [MODIFY] [page.tsx](file:///c:/Users/OmAgrawal/Downloads/dashboardaistudio/app/campaign/[orgId]/page.tsx)
- Pass `termsConfig` prop to `UnifiedBookingForm`.
- Remove manual `termsAccepted` state and redundant `TermsModal` from the page level.
- Clean up the `BookingOverlay` to remove the manual T&C checkbox.

---

### [Package Details Page](file:///c:/Users/OmAgrawal/Downloads/dashboardaistudio/app/site/[orgId]/package/[packageId]/page.tsx)

#### [MODIFY] [page.tsx](file:///c:/Users/OmAgrawal/Downloads/dashboardaistudio/app/site/[orgId]/package/[packageId]/page.tsx)
- Pass `termsConfig` prop to `UnifiedBookingForm`.
- Remove manual `termsAccepted` state and redundant `TermsModal` from the page level.
- Clean up the `BookingOverlay` to remove the manual T&C checkbox.

## Verification Plan

### Automated Tests
- N/A (Manual browser verification preferred for UI flow)

### Manual Verification
1.  Open the Campaign page or Package details page.
2.  Navigate through the booking steps.
3.  On the final page of the booking form, verify the T&C checkbox appears.
4.  Try to click "Complete Booking" without checking the T&C (if mandatory) and verify the alert.
5.  Click "Terms & Conditions" to open the modal, read the content, and accept.
6.  Verify the booking submits correctly after acceptance.
