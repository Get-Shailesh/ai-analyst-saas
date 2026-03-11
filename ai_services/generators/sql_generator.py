"""SQL query generator from dataset schema."""
import uuid
from dataclasses import dataclass

@dataclass
class GeneratedQuery:
    id: str
    title: str
    description: str
    sql: str
    dialect: str = "postgresql"

def generate_queries(columns: list[dict], table: str = "dataset") -> list[GeneratedQuery]:
    col_names  = [c["name"] for c in columns]
    num_cols   = [c["name"] for c in columns if c["dtype"] not in ("object", "string", "str")]
    cat_cols   = [c["name"] for c in columns if c["dtype"] in ("object", "string", "str")]
    first_col  = col_names[0] if col_names else "id"
    last_num   = num_cols[-1] if num_cols else col_names[-1]
    group_col  = cat_cols[0] if cat_cols else first_col

    queries = [
        GeneratedQuery(
            id=str(uuid.uuid4()),
            title="Aggregated Summary by Group",
            description=f"Key metrics grouped by {group_col}",
            sql=(
                f"SELECT\n"
                f"  {group_col},\n"
                f"  COUNT(*)                      AS row_count,\n"
                f"  ROUND(AVG({last_num})::NUMERIC, 2) AS avg_value,\n"
                f"  SUM({last_num})               AS total_value,\n"
                f"  MAX({last_num})               AS max_value,\n"
                f"  MIN({last_num})               AS min_value\n"
                f"FROM {table}\n"
                f"GROUP BY {group_col}\n"
                f"ORDER BY total_value DESC;"
            ),
        ),
        GeneratedQuery(
            id=str(uuid.uuid4()),
            title="Period-over-Period Change",
            description="Row-level change vs previous row using window function",
            sql=(
                f"SELECT\n"
                f"  *,\n"
                f"  LAG({last_num}) OVER (ORDER BY {first_col}) AS prev_value,\n"
                f"  ROUND(\n"
                f"    ({last_num} - LAG({last_num}) OVER (ORDER BY {first_col}))\n"
                f"    / NULLIF(LAG({last_num}) OVER (ORDER BY {first_col}), 0) * 100\n"
                f"  , 2) AS pct_change\n"
                f"FROM {table}\n"
                f"ORDER BY {first_col};"
            ),
        ),
        GeneratedQuery(
            id=str(uuid.uuid4()),
            title="Statistical Outlier Detection",
            description="Rows where value is more than 2 standard deviations from the mean",
            sql=(
                f"WITH stats AS (\n"
                f"  SELECT\n"
                f"    AVG({last_num})    AS mean_val,\n"
                f"    STDDEV({last_num}) AS std_val\n"
                f"  FROM {table}\n"
                f")\n"
                f"SELECT\n"
                f"  t.*,\n"
                f"  ROUND(ABS((t.{last_num} - s.mean_val) / NULLIF(s.std_val, 0))::NUMERIC, 3) AS z_score\n"
                f"FROM {table} t\n"
                f"CROSS JOIN stats s\n"
                f"WHERE ABS((t.{last_num} - s.mean_val) / NULLIF(s.std_val, 0)) > 2\n"
                f"ORDER BY z_score DESC;"
            ),
        ),
        GeneratedQuery(
            id=str(uuid.uuid4()),
            title="Running Total",
            description="Cumulative sum over the dataset",
            sql=(
                f"SELECT\n"
                f"  {first_col},\n"
                f"  {last_num},\n"
                f"  SUM({last_num}) OVER (ORDER BY {first_col}) AS running_total,\n"
                f"  ROUND(SUM({last_num}) OVER (ORDER BY {first_col}) / SUM({last_num}) OVER () * 100, 2) AS cumulative_pct\n"
                f"FROM {table}\n"
                f"ORDER BY {first_col};"
            ),
        ),
    ]
    return queries
