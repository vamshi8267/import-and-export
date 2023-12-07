const express = require('express')
const app = express()

const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())
const databasePath = path.join(__dirname, 'covid19India.db')
let database = null

const initializeDbAndServer = async => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStateQuery = ` 
    SELECT 
    *
    FROM
    state
    ORDER BY
    state_id;
    `
  const dbArray = await database.all(getStateQuery)
  response.send(
    dbArray.map(eachState => convertStateDbObjectToResponseObject(eachState)),
  )
})

app.get('/starts/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id = ${stateId};
    `
  const state = await database.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
    INSERT INTO
    district ( district_name, state_id, cases, cured, active, deaths )
    VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${death} );`
  await database.run(postDistrictQuery)
  response.send('District Successfully Addded')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    district_id = ${districtId};
    `
  const district = await database.get(getDistrictQuery)
  response.send(convertDistrictDbObjectToResponseObject(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM
    district
    WHERE
    district_id = ${districtId};
    `
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = ` 
    UPDATE
    district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};
    `
  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params;
  const getDistrictStateQuery = `
  SELECT
  SUM(cases) as totalCases,
  SUM(curved) as totalCured,
  SUM(active) as totalActive,
  SUM(deaths) as totalDeaths
  FROM
  district
  WHERE
  state_id = ${stateId};
  `;
  const stateArray = await database.get(getDistrictStateQuery);
  response.send(stateArray);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
  select state_id from district
  where district_id = ${districtId};
  `;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  const getStateNameQuery = `
  select state_name as stateName from state
  where state_id = ${getDistrictIdQueryResponse.state_id};
  `;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
