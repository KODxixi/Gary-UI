import type { Meta, StoryObj } from "@storybook/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card"
import { Button } from "./button"

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    material: { control: "select", options: ["regular", "thick"] },
    size: { control: "select", options: ["default", "sm"] },
    asChild: { control: false },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-[380px]">
      <CardHeader>
        <CardTitle>Project north star</CardTitle>
        <CardDescription>
          Elevation, motion and glass all resolve to Gary tokens — no hardcoded values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This surface uses --gary-solid-plate and the card radius token. Switch themes
          from the toolbar to watch the plate flip without touching this file.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Secondary</Button>
        <Button>Primary</Button>
      </CardFooter>
    </Card>
  ),
}

export const Thick: Story = {
  args: { material: "thick" },
  render: (args) => (
    <Card {...args} className="w-[380px]">
      <CardHeader>
        <CardTitle>Thick material</CardTitle>
        <CardDescription>Higher elevation, deeper shadow token.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">cardVariants material="thick".</p>
      </CardContent>
    </Card>
  ),
}

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => (
    <Card {...args} className="w-[280px]">
      <CardHeader>
        <CardTitle>Compact</CardTitle>
        <CardDescription>Dense spacing token.</CardDescription>
      </CardHeader>
    </Card>
  ),
}
