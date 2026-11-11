import type { Meta, StoryObj } from "@storybook/react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "./sheet"
import { Button } from "./button"

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof Sheet>

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open right sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Sheet slides in from the right with Momentum spring (response 0.3s, damping 0.8).
          </SheetDescription>
        </SheetHeader>
        <div style={{ padding: "16px 0" }}>
          <p className="text-sm text-muted-foreground">
            Content area. Spring physics drives the slide — not a CSS transition.
          </p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const Open: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Always open</SheetTitle>
          <SheetDescription>For visual regression capture.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}
