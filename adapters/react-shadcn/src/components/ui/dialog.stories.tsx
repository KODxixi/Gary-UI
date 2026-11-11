import type { Meta, StoryObj } from "@storybook/react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog"
import { Button } from "./button"

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Dialog>

// For interaction: click the trigger.
export const Trigger: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Materialize spring</DialogTitle>
          <DialogDescription>
            Scale 0.96 → 1 and opacity 0 → 1 are driven by useSpringStyle on the real
            DialogContent — no CSS transition.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

// For screenshots / visual regression: force the dialog open (Radix Root accepts
// a controlled `open` prop; without onOpenChange it stays put).
export const Open: Story = {
  render: () => (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ready to ship?</DialogTitle>
          <DialogDescription>
            This state is what the visual-regression capture targets. Overlay uses
            opacity 0.25s spring; content uses scale + opacity springs.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Dismiss</Button>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
