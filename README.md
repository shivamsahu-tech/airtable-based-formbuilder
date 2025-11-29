# Airtable Form Builder

build custom forms with airtable, and store response in both airtable and the mongoDB.

Deployed on vercel and render
client: https://airtable-form.vercel.app
server: https://airtable-based-formbuilder.onrender.com


## Setup Instrucitons: 


This Project contains 2 sub sobfolder /client and /server.

- clone the project
```jsx
git clone https://github.com/shivamsahu-tech/airtable-based-formbuilder.git
cd airtable-based-from
```
- Setup client

install packages
```jsx
cd client
npm install
```

configure env
```jsx
VITE_API_BASE_URL=your-server-url
```

run the file
```jsx
npm run dev
```

- Setup Server

install packages
```jsx
cd server
npm install
```

configure env
```jsx
PORT=5000
AIRTABLE_CLIENT_ID=
AIRTABLE_CLIENT_SECRET=
AIRTABLE_REDIRECT_URI=
FRONTEND_BASE_URL=
FRONTEND_REDIRECT_URL=
MONGO_URI=
SESSION_SECRET=
REDIS_URL=
BACKEND_URL=
CORS_ORIGINS=
NODE_ENV=
```

run the file
```jsx
npm run dev
```

- Setup Airtable

visit `https://airtable.com/create/oauth`

create new user with required permissions

add callback url to the `your-frontend-url/auth/callback`

save user


- Now This will create your whole setup and now user can access the airtable Oauth and can access the tables and create the forms


### Airtable Oauth setup
- when user create login store, it redirect to the `https://airtable.com/oauth2/v1/authorize` url with some required parameters, and it open up the airtable auth page.
- User select the bases and give the permission, then the airtable server send a body request to the callback url saved in the airtable builder hub section.
- That request body contains code and state, because we already stored code_verifier in the redis, so here we exchange tokes by requesting on `https://airtable.com/oauth2/v1/token` and then we fetch the airtable user id on the whoami endpoint of the airtable, and create and update the mongodb if user already exist.
- send the cookies back to the client.

### Data Model Explanation
- We have 3 models user, form, responses, in user model, it have all filed that is required like airtable id, tokens etc, in the form model we have questions schema, conditional scheman and condition schema to maintain what the assignment demand. And in the reponse model it have basic structure of fileds like recordId, deleteInAirtable etc as per requirements.

### Conditional logic Explanation
- we are creating condition for each question if user want to create any condition, and we will ask conditions fields like `depend upon`, `operator(equal, not equal)` and the `value`. and according to user filled data we create condition for each questionKey.

### Webhook configuration
- during the setup of each base, we are calling to a funciton existWebhook() that verify if webhook exist for this base or not, if not then it create webhook, by creating api request on the airtable url `${AIRTABLE_API_BASE}/bases/${baseId}/webhooks` and storing the airtablebaseid with webhookid in the mongodb.
- now created the api routes for receiving the request for any changes in the airtable tables, and in those controller, updating our database in the mongodb accordingly.

### How to run the project
- After the setup as accodingly (as given above), npm run dev command, will run the client and server both project.

### Screen shot and demo videos

![Image 1](https://drive.google.com/uc?export=view&id=1g3OWWHG38b7_6XVfu8Vh9b7LNbvZ8bZ4)
![Image 2](https://drive.google.com/uc?export=view&id=1qizRIU9tC7PdLJu3bemgmIZriQO1Iba_)
![Image 3](https://drive.google.com/uc?export=view&id=1_9jZJwBv1vib1bmyZ0i7-BWyw7WE9IV4)
![Image 4](https://drive.google.com/uc?export=view&id=1BkJVvfHaBd2knZ8VOF_2qzjabVqYHOOJ)
![Image 5](https://drive.google.com/uc?export=view&id=1jri8AMJD92vgIlImbX6ck9dWZ-H45-Gi)

[Watch Demo Video](https://drive.google.com/file/d/18Q0z-MypHZtwsqmSFjBkbJ2IAoP3yiMS/view?usp=sharing)

--- 
## Other specificaiton
- Export in CSV functionality
- Rename the question label.
- Used redis.
- Clean and minimal ui.

