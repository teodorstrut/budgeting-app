this is the continuation of the development plan of the budgeting ledger app.
since the latest chnages, there are a few issues and features i want implemented in this new version (1.1)

1. bugs:
  a. when a user enters the the add/edit transaction page (add.tsx/bill-splitter.tsx), when we hit the back button, the screen returns to the current month view, so edits in past months are very tedious to do, as you always have to navigate backwards in the history.tsx view
  b. when opening the add.tsx notex page, and then opening the calculator, both the native keyboard of the phone + the custom calculator are open. there should only one be open, prefferably the latest accessed functionality(either notes keyboard or calculator overlay)
  c. the automatic sync at 2AM duplicates some of the transactions, it doesn't check what is already in the sheet, we need to fix this, and make it work like the manual sync. check if there are code differences, and if yes, use the same code for both functionalities
  d. in the reports screen, it does not take into account, when opening the page, on what day the month starts. for example, i am on 1st of june, but my month start is set on the 15th, so normally, i should still see the expenses from the 15th of may onward. this issue is the same for the history screen as well.
2. features:
  a. I need on the reports screen, the possibility of tapping on a income/expense in the "All Categories" part of the scree, for that particular month, and open a drawer/modal, showing all transactions for that particular category.
  c. I want a feature of synchronizing user categories and budgets from a google sheet
    - users should be able to select a sheet, same as with the transactions sheet, and validate to not use the same sheet for this functionalities, or alternatively create a new sheet.
    - in this sheet, all users can export their categories, in this way:
      - unicity is derived by the emoji and the lower variant of the category's name. If these 2 criteria are met, for example, both user a and user b have a groceries transaction, one user has the name "Groceries" and the other "groceries", and both have the same emoji for that category, this category is practially the same, and the row should become only one in the google sheet.
    - after both users exported their categories, they can choose to import them back into the app in a unified manner, respecting each user's category ids, by doing the same check we did in step 1,
    - the budget should also be exported as the sum for that category. let's say for now, that the greatest budget should replace the smaller budget. each budget sum for each category row.
  b. I want a way to see the other user's transactions in the budgeting ledger, in a read-only way. This is an extensive feature that i want to plan throughly.
    - the sync functionality should work in tandem with these changes. both manual syncs and automated syncs should pull from the other users transactions and mark them readonly and foreing in the user's app.
    - deleted transactions in the excel should be ignored, and excluded from operations
    - first off, we need a way to differentiate transactions in the index.tsx, history.tsx and reports.tsx view from the user's own transactions, and other people's transactions. Prefferably there will be a toggle to see either owned transactions and everyone else's transactions. this toggle should be non-intrusive and available on all mentioned pages
    - the transactions should have a grey-ish background to denote non-interactivity, also have a small icon indicating they are from other users.
    - this means there should be a difference between the user's categories and other user's categories. the categories of other users should also be marked as readonly, and have a grey-ish tone indicating non-interactivity. 
      - additionaly, there should be a way to "adopt" them in the user's list of categories, by hitting a button, and marking them as owned by the user as well. this import should tie to the category import mechanism, better said, to check the unicity using the category name + emoji when importing these foreign categories. if the lower variant of the category name and the emoji are the same, the user will continue seeing his version of the updated category.

