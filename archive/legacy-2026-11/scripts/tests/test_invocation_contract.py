from __future__ import annotations

import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from invocation_contract import (  # noqa: E402
    InvocationContractError,
    invocation_from_axes,
    load_schema,
    normalize_invocation,
)


def valid_invocation() -> dict:
    return {
        "schemaVersion": 1,
        "skill": "gary-liquidglass-ui",
        "application": "web-ui",
        "page": "data-page",
        "theme": "dark",
        "material": "regular",
        "density": "balanced",
    }


class InvocationContractTests(unittest.TestCase):
    def test_canonical_schema_examples_are_valid(self) -> None:
        schema = load_schema()
        for example in schema["examples"]:
            self.assertEqual(normalize_invocation(example, schema=schema), example)

    def test_valid_invocation_is_preserved(self) -> None:
        invocation = valid_invocation()
        self.assertEqual(normalize_invocation(invocation), invocation)

    def test_missing_or_unknown_fields_are_rejected(self) -> None:
        missing = valid_invocation()
        del missing["page"]
        with self.assertRaisesRegex(InvocationContractError, "缺字段: page"):
            normalize_invocation(missing)

        extra = valid_invocation()
        extra["reactAdapterStrategy"] = "demand-driven"
        with self.assertRaisesRegex(InvocationContractError, "未知字段"):
            normalize_invocation(extra)

    def test_invalid_axis_value_is_rejected(self) -> None:
        invocation = valid_invocation()
        invocation["material"] = "solid"
        with self.assertRaisesRegex(InvocationContractError, "material"):
            normalize_invocation(invocation)

    def test_route_builder_requires_application_and_page_but_reads_system_defaults(self) -> None:
        route = invocation_from_axes("web-ui", "data-page")
        self.assertEqual(route["application"], "web-ui")
        self.assertEqual(route["page"], "data-page")
        self.assertEqual(route["theme"], "dark")
        self.assertEqual(route["material"], "ultrathin")
        self.assertEqual(route["density"], "balanced")


if __name__ == "__main__":
    unittest.main()
