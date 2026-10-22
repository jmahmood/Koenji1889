# Dispatch layout correction · 22 October 2026

The final purchase step now has one compact summary. Its duplicate dispatch voucher was removed. Revise Order, Cancel Order, and the Hanko purchase stamp live in the persistent footer outside the scrolling content area.

Header, stepper, introduction, and summary spacing were reduced. The review uses three columns on desktop, adapting to narrower screens. Short desktop windows receive a more compact layout while retaining readable text.

Verified in a real browser against disposable game fixtures:

- 1840×928, 1440×900, 1366×768, 1280×720, 1024×640, and 800×600: the normal purchase review fits without scrolling.
- 390×844 and 360×640: stamp stays fully within the viewport and can be clicked without scrolling. At 360×640, review details scroll independently above the footer.
- Every size checks button bounds and hit testing, that the button belongs to the footer, and that no duplicate voucher remains.
- All nine purchase, transfer, emergency, rust, trade-in, insolvency, and mobile scenarios passed with no browser runtime errors.
- All 202 JavaScript tests passed; production build passed with the existing bundle-size advisory.

`dispatch-layouts.json` contains measured button geometry and content overflow. Screenshots include the 1366×768 desktop review and 360×640 mobile review. No real games were modified.
