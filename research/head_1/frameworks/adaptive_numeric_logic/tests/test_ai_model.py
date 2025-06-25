import unittest
from ai_core.ai_model import AIModel

class TestAIModel(unittest.TestCase):
    def test_interact(self):
        ai_model = AIModel()
        response = ai_model.interact("Solve equation")
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)
        self.assertIn("solve_equation", response)

if __name__ == "__main__":
    unittest.main()
