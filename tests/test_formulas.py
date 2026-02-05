import math
import unittest

def calculate_chunks(total_items, ram_limit):
    """Calculates number of initial sorted runs."""
    return math.ceil(total_items / ram_limit)

def calculate_passes(num_chunks, k_way):
    """Calculates number of merge passes required."""
    if num_chunks <= 1:
        return 0
    # log base K of chunks, ceiled
    return math.ceil(math.log(num_chunks, k_way))

class TestExternalSortFormulas(unittest.TestCase):
    
    def test_chunks_exact_fit(self):
        # 100 items, RAM 10 -> 10 chunks
        self.assertEqual(calculate_chunks(100, 10), 10)
        
    def test_chunks_remainder(self):
        # 105 items, RAM 10 -> 11 chunks
        self.assertEqual(calculate_chunks(105, 10), 11)
        
    def test_single_chunk(self):
        # 5 items, RAM 10 -> 1 chunk (sorted in RAM)
        self.assertEqual(calculate_chunks(5, 10), 1)

    def test_passes_k2(self):
        # 8 chunks, K=2 -> log2(8) = 3 passes
        self.assertEqual(calculate_passes(8, 2), 3)

    def test_passes_k2_irregular(self):
        # 9 chunks, K=2 -> log2(9) = 3.17 -> 4 passes
        self.assertEqual(calculate_passes(9, 2), 4)

    def test_passes_k3(self):
        # 27 chunks, K=3 -> log3(27) = 3 passes
        self.assertEqual(calculate_passes(27, 3), 3)
        
    def test_passes_single_run(self):
        # 1 chunk -> 0 passes (already sorted)
        self.assertEqual(calculate_passes(1, 4), 0)

if __name__ == '__main__':
    unittest.main()
