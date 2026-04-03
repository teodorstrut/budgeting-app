this is the budgeting ledger application
this app is intended for tracking my own personal finances on my mobile device as easily as possible
this app is a react native app built with expo
this app has the following techical requirements:
- persist data on my local device
- have a relational sqlite database for this purpose
- have a clean and reusable component library using the react native building blocks, overriden with my styleguide
- have a way of syncing my data to a google sheets
- have the ability to render graphical elements like charts

this app has the following functional requirements:
- transactions management: add/modify/delete transactions
  - transactions have: type(income/expense), note, category(user-definable), sum, date and time of transaction
  - categories have: emoji, name and type(income/expense)
- budget definition: ability to define a budget for the existing categories
- historical data: ability to view current month's data and every past month's data
- reporting capabilites, including:
  - a pie chart with the percentage per each category, broken by expense/income
  - a bar chart per category accross months comparing the evolution of each category by month compared to a budget (as a toggleable feature)
  - total sums for each category for a month ordered from highest to lowest
- app configuration section where:
  - the user can select either a dark or a light theme
  - the user can sync with a google account and select a google sheet to sync the data to. the app should do the rest(create a page, and push on new rows each transaction)
  - month start day(from 1 to 28 of a month)
  - category management section where users cand add/modify/delete existing categories and their details
  - budget definition section where for each category a budget can be allocated, and where a grand total will be displayed in incomes vs expenses

this app has a design folder, containing the theme called mint_honey_night,and the functionalities described above. each folder contains an image of the screen and the html code for it. I want you to analyze the design and come up with a list of reusable component for each of these screens

create a comprehensive folder structure of the project.

I also want you to work with types, and a clear and solid structure

analyze all of this data and create a comprehensive development plan for each of the requirements, and detail all of this in an md file