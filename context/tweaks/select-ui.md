In Select Components imported from `@/components/ui/select`

I noticed that the structure of most of them is

```
SelectContent
    SelectItem
    SelectItem
    etc.
SelectContent
```

This creates a visual spacing irregularity.
I want these changed to

```
<SelectContent position="popper">
    <SelectGroup>
            <SelectItem ></SelectItem>
            <SelectItem ></SelectItem>
    </SelectGroup>
</SelectContent>
```

`SelectItem` is wrapped with `SelectGroup` and `SelectContent` has position set to `popper`.

Change all the parts that have `Select` component imported and used.

However, this UI change should not affect the functionality and workings of the flow! Only change the UI.
