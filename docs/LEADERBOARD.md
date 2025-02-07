# Sales Leaderboard System

The Sales Leaderboard in Royal Precast CRM is designed to measure and rank sales performance using a comprehensive scoring system that takes into account multiple aspects of sales effectiveness.

## Time Periods

The leaderboard can be filtered by different time periods:
- Today
- Yesterday
- Last 7 days
- Last 30 days
- Last 3 months
- Last 12 months
- Custom date range

## Key Metrics

For each sales representative, the system tracks:

1. **New Orders**
   - Count of orders created during the selected time period
   - Total value of new orders

2. **Paid Orders**
   - Count of orders that received payments during the period
   - Total revenue from payments received

3. **Conversion Rate**
   - Percentage of new orders that received payments
   - Calculated as: (Paid Orders / New Orders) × 100
   - Example: If a rep created 10 new orders and 6 received payments, their conversion rate would be 60%

## Scoring System

The final ranking is determined by a weighted score that balances three key performance indicators:

1. **Revenue Performance (60%)**
   - 60% of the score is based on actual payments received
   - Rewards reps who bring in the most revenue

2. **Sales Activity (10%)**
   - 10% of the score is based on the value of new orders
   - Encourages continuous sales activity and pipeline building

3. **Payment Effectiveness (30%)**
   - 30% of the score is based on the conversion rate
   - Rewards reps who are effective at securing payments for their orders

### Score Calculation Example

For a sales representative with:
- Paid Revenue: $10,000
- New Orders Value: $15,000
- Conversion Rate: 70%

Their weighted score would be:
```
Score = ($10,000 × 0.6) + ($15,000 × 0.1) + (70 × 0.3)
      = 6,000 + 1,500 + 21
      = 7,521
```

## Unattributed Sales

- Sales without a clear creator are tracked separately as "Unattributed Sales"
- These use the same scoring system but appear at the bottom of the leaderboard
- Helps identify orders that need proper attribution

## Best Practices

To perform well on the leaderboard:
1. Focus on securing payments for orders quickly
2. Maintain a healthy pipeline of new orders
3. Ensure all orders are properly attributed to avoid unattributed sales
4. Monitor your conversion rate and work on improving it

## Notes

- The leaderboard updates in real-time as orders and payments are processed
- Historical performance can be viewed by adjusting the time period
- Individual metrics can be viewed by hovering over the score details
