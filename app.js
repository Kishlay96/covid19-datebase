const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const IntializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost/:3000/");
    });
  } catch (error) {
    console.log(`Database error is ${error.message}`);
    process.exit(1);
  }
};

IntializeDbServer();

const stateResponseObj = (dbObje) => {
  return {
    stateId: dbObje.state_id,
    stateName: dbObje.state_name,
    population: dbObje.population,
  };
};

const districResponseObj = (dbObje) => {
  return {
    districtId: dbObje.district_id,
    districtName: dbObje.district_name,
    stateId: dbObje.state_id,
    cases: dbObje.cases,
    cured: dbObje.cured,
    active: dbObje.active,
    deaths: dbObje.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const stateListQuery = `SELECT * FROM state;`;
  const stateListArray = await db.all(stateListQuery);
  response.send(stateListArray.map((eachState) => stateResponseObj(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT * FROM state 
    WHERE state_id = ${stateId};`;
  const state = await db.get(stateQuery);
  response.send(stateResponseObj(state));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districQuery = `SELECT * FROM district WHERE district_id = ${districtId}; `;
  const districArray = await db.get(districQuery);
  response.send(districResponseObj(districArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districDeleteQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(districDeleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `UPDATE district SET district_name = '${districtName}',
   state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths}
   WHERE district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT 
    SUM(cases) ,SUM(cured),SUM(active),SUM(deaths) FROM district 
    WHERE state_id = ${stateId};`;
  const getStats = await db.get(getStatsQuery);
  response.send({
    totalCases: getStats["SUM(cases)"],
    totalCured: getStats["SUM(cured)"],
    totalActive: getStats["SUM(active)"],
    totalDeaths: getStats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const detailsQuery = `SELECT state_name FROM district NATURAL JOIN  state WHERE district_id = ${districtId} ;`;
  const stateNm = await db.get(detailsQuery);
  response.send({ stateName: stateNm.state_name });
});

module.exports = app;
