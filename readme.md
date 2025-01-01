# TrapTrends API

**TrapTrends** is an API that provides predictions for bike traffic on Flemish cycle highways. The system predicts how many cyclists will pass by a specific bike counter over the course of the next hour at various locations. Check out the API on **plofski.pythonanywhere.com** ! 

**DISCLAIMER: the predicted amount is an estimate and may deviate from the actual value. Use this information at your own discretion and responsibility.** 

With **TrapTrends**, users can:
- Retrieve information about bike counters at different locations.
- Get predictions for the expected bike traffic at a given location.

## API Overview

| Endpoint          | Method | Description                                               |
|-------------------|--------|-----------------------------------------------------------|
| `/sites`          | GET    | Retrieve information about all bike counter locations     |
| `/sites/{id}`     | GET    | Retrieve information about a specific bike counter by ID |
| `/predict/{id}`   | GET    | Predict the number of cyclists in the next hour at a given site ID |


And many more (be sure to check out the `/docs`!)