An issues has been found in 02-ui-design-system.md file execution

The issue:

1. When visiting the /ui-preview endpoint, it is giving a hydration error

This is the issue description:

```
Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:
- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

See more info here: https://nextjs.org/docs/messages/react-hydration-error


+
Client
-
Server
  ...
    <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
      <RedirectBoundary>
        <RedirectErrorBoundary router={{...}}>
          <InnerLayoutRouter url="/ui-preview" tree={[...]} params={{}} cacheNode={{rsc:{...}, ...}} segmentPath={[...]} ...>
            <SegmentViewNode type="page" pagePath="ui-preview...">
              <SegmentTrieNode>
              <UiPreviewPage>
                <AppShell>
                  <div className="min-h-svh ...">
                    <div className="flex min-h...">
                      <aside>
                      <div className="flex min-w...">
                        <AppTopbar>
                          <header className="sticky top...">
                            <div className="flex h-14 ...">
                              <div className="flex items...">
                                <Sheet>
                                <LinkComponent>
                                  <LinkComponent href="/" className="font-semib...">
+                                   <a
+                                     className="font-semibold text-foreground lg:hidden"
+                                     ref={function}
+                                     onClick={function onClick}
+                                     onMouseEnter={function onMouseEnter}
+                                     onTouchStart={function onTouchStart}
+                                     href="/"
+                                   >
-                                   <button
-                                     data-slot="button"
-                                     data-variant="ghost"
-                                     data-size="icon"
-                                     className={"group/button inline-flex shrink-0 items-center justify-center round..."}
-                                     type="button"
-                                     aria-label="Open navigation"
-                                     aria-haspopup="dialog"
-                                     aria-expanded="false"
-                                     aria-controls="radix-_R_1b9bn5rlb_"
-                                     data-state="closed"
-                                   >
                              ...
                        ...
            ...
          ...
components/app/app-topbar.tsx (68:11) @ AppTopbar


  66 |             </SheetContent>
  67 |           </Sheet>
> 68 |           <Link href="/" className="font-semibold text-fore...
     |           ^
  69 |             scōre.
  70 |           </Link>
  71 |         </div>
Call Stack
15

Show 11 ignore-listed frame(s)
a
<anonymous>
AppTopbar
components/app/app-topbar.tsx (68:11)
AppShell
components/app/app-shell.tsx (22:11)
UiPreviewPage
app/ui-preview/page.tsx (109:5)
```

2. In /ui-preview endpoint, when the left panel is scrolled down, the static values inside the sidebar such as Dashboard, New Scan, Reports, Usage and Settings are also going up and disappearing from view rather than staying in one spot

Fix these issues
