resource "google_vertex_ai_index" "context_memory_index" {
  display_name = "Context Memory Index"
  description  = "RAG Vector Store for model prompt context optimization"
  
  metadata {
    config {
      dimensions                  = 768
      approximate_neighbors_count = 150
      distance_measure_type       = "COSINE"
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count    = 1000
          leaf_nodes_to_search_percent = 10
        }
      }
    }
  }
}
