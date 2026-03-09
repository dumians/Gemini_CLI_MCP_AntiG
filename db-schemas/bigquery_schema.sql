-- BigQuery EDW Schema (Analytical & Marketing)
-- We execute these in a specific dataset, e.g. `marketing_edw`
CREATE SCHEMA IF NOT EXISTS marketing_edw;
CREATE TABLE IF NOT EXISTS marketing_edw.customer_segments (
    customer_id STRING OPTIONS(description = "Matches the ID in AlloyDB"),
    segment_name STRING OPTIONS(description = "e.g. VIP, Churn Risk"),
    lifetime_value FLOAT64,
    last_interaction TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketing_edw.campaign_metrics (
    campaign_id STRING,
    segment_name STRING,
    spend FLOAT64,
    impressions INT64,
    conversions INT64,
    date DATE
);
CREATE TABLE IF NOT EXISTS marketing_edw.web_events (
    event_id STRING,
    customer_id STRING,
    event_type STRING,
    page_url STRING,
    event_timestamp TIMESTAMP
) PARTITION BY DATE(event_timestamp) CLUSTER BY customer_id;
-- Insert some simulated segment data
INSERT INTO marketing_edw.customer_segments (
        customer_id,
        segment_name,
        lifetime_value,
        last_interaction
    )
VALUES (
        'CUST-999',
        'VIP',
        125000.00,
        CURRENT_TIMESTAMP()
    ),
    (
        'CUST-100',
        'Standard',
        500.00,
        CURRENT_TIMESTAMP()
    );