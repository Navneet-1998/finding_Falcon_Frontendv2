import {Button, Modal} from "react-bootstrap"
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useState, useEffect, useMemo } from "react";
import "./find.css";


// This function will fetch the all planets data from "https://findfalcone.geektrust.com/planets".return all planets data 
const fetchData = async () => {
  try {
    const response = await fetch("https://findfalcone.geektrust.com/planets");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

// This function will fetch the datafrom "https://findfalcone.geektrust.com/vehicles". return all vehicles data 
const fetchVehicles = async () => {
  try {
    const response = await fetch("https://findfalcone.geektrust.com/vehicles");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};

// This function will fetch from from "https://findfalcone.geektrust.com/token", return new token on every fetch 
async function getToken() {
  const url = "https://findfalcone.geektrust.com/token";
  const headers = {
    Accept: "application/json",
  };

  try {
    const response = await axios.post(url, {}, { headers });
    const token = response.data.token;
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
}

function FindingFalcon() {
  const { enqueueSnackbar } = useSnackbar();

  let vehicleSpeed = Array.from({ length: 4 });
  let planetDistance = Array.from({ length: 4 });

  const [vehicles, setVehicles] = useState([]);
  const [planets, setPlanets] = useState([]);
  const [timetaken, settimetaken] = useState(0);
  const [planetList, setPlanetList] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);

  //This function will return an object {vehicleName : total_no} 
  const initialAvailableVehicles = useMemo(() => {
    return vehicles.reduce((acc, vehicle) => {
      const { name, total_no } = vehicle;
      acc[name] = total_no;
      return acc;
    }, {});
  }, [vehicles]);

  const [availableVehicles, setAvailableVehicles] = useState(
    initialAvailableVehicles
  );
  const [foundPlanet, findingPlanet] = useState();
  const [gotMessage, gettingMessage] = useState();

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [selectedDropdownIndexes, setSelectedDropdownIndexes] = useState(
    Array.from({ length: 4 }, () => 0)
  );

  //This useEffect will  fetched planets data & vehicles data and update setPlanets & setVehicles
  useEffect(() => {
    const fetchPlanets = async () => {
      const data = await fetchData();
      if (data.length > 0) {
        setPlanets(data);
      }
    };

    const fetchVehicle = async () => {
      const data = await fetchVehicles();
      if (data.length > 0) {
        setVehicles(data);
      }
    };

    fetchVehicle();

    fetchPlanets();
  }, []);

  //This useEffect will update settimetaken 
  useEffect(() => {
    const calTotalTime = () => {
      let total = 0;
      for (let i = 0; i < 4; i++) {
        if (planetDistance[i] && vehicleSpeed[i]) {
          total = total + Math.floor(planetDistance[i] / vehicleSpeed[i].speed);
        }
      }
      if (total > 0) {
        settimetaken(total);
      }
    };

    calTotalTime();
  });

  // This function will reset all the value
  const reset = () => {
    setPlanetList([]);
    setVehicleList([]);
    setSelectedDropdownIndexes(Array.from({ length: 4 }, () => 0));
    setAvailableVehicles(initialAvailableVehicles);
    settimetaken(0);
    setShowSuccessModal(false);
    vehicleSpeed = Array.from({ length: 4 });
    planetDistance = Array.from({ length: 4 });
  };

  //This function will POST the token, planetList and vehicleList to "https://findfalcone.geektrust.com/find". return response data 
  const result = async () => {
    try {
      if(!validator()){
        return 
      }
      // Call the getToken function to get the token
      const authToken = await getToken();

      if (authToken) {
        const requestBody = {
          token: authToken,
          planet_names: planetList,
          vehicle_names: vehicleList,
        };

        // Set headers for the request
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        // Make the POST request to find falcone API
        const response = await axios.post(
          "https://findfalcone.geektrust.com/find",
          requestBody,
          { headers }
        );

        if (response.status === 200 && response.data.status === "success") {
          findingPlanet(response.data.planet_name);
          gettingMessage(
            "Success! Congratulations on Finding Falcon. King Shan is mighty pleased."
          );
          setShowSuccessModal(true);
        } else if (
          response.status === 200 &&
          response.data.status === "false"
        ) {
          gettingMessage(
            "YOU LOST! You were unable to find Queen Al Falcone, Now she exiled for another 15 years…."
          );
          findingPlanet("Not Found!");
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      if (error.response) {
        enqueueSnackbar(error.response.data.error, { variant: "error" });
      } else {
        enqueueSnackbar(
          "Something went wrong, Check that the backend is running, reachable and return valid JSON.",
          { variant: "error" }
        );
      }
    }
  };

//This function will handle all the validation 
  const validator = () => {
    let count=0;
    for(let i=0; i<4; i++){
     if(planetList[i] !== undefined && vehicleList[i] === undefined){
        enqueueSnackbar(
          "Please Select Vehicle For Planet.",
          { variant: "error" }
          );
          return false
      }else if(planetList[i] === undefined && vehicleList[i] === undefined){
        count = count + 1;
      }
    }

    if(count > 3){
      enqueueSnackbar(
        "Please Select Planets And Vehicles.",
        { variant: "error" }
        );
        return false
    }


  return true
  }

  // This function will display dropdown values and disable other option
  const selectOptions = (planet, dropdownIndex) => {
    let planetsName = [];
    let planetsDistance = [];

    if (planet) {
      for (let index = 0; index < planet.length; index++) {
        planetsName.push(planet[index].name);
        planetsDistance.push(planet[index].distance);
      }
      const selectedPlanet = planetList[dropdownIndex];
      return planetsName.map((option, index) => {
        if (dropdownIndex === 0 && index === 0 && selectedPlanet) {
          return (
            <option key={index} value={option} disabled>
              {option}
            </option>
          );
        } else if (
          selectedDropdownIndexes[dropdownIndex] === index &&
          option === selectedPlanet
        ) {
          return (
            <option key={index} value={option} selected>
              {option}
            </option>
          );
        } else if (
          !planetList.includes(option) &&
          !vehicleList[dropdownIndex]
        ) {
          return (
            <option key={index} value={option}>
              {option}
            </option>
          );
        } else {
          return (
            <option key={index} value={option} disabled>
              {option}
            </option>
          );
        }
      });
    }
  };

  // This function will update setPlanetList and setSelectedDropdownIndexes
  const updateList = (event, destinationIndex) => {
    const value = event.target.value;
    const newList = [...planetList];
    if (!newList.includes(value)) {
      newList[destinationIndex] = value;
      setPlanetList(newList);
      renderRadioButtons(
        vehicles,
        destinationIndex,
        vehicleList,
        setVehicleList
      );
    }
    setSelectedDropdownIndexes((prevIndexes) => {
      const newIndexes = [...prevIndexes];
      newIndexes[destinationIndex] = planets.indexOf(value); // Update the selected planet index for the dropdown
      return newIndexes;
    });
  };

  //This function will display all the vehicles total_no, name and max_distance from vehicles data when each dropdown get selected
  const renderRadioButtons = (options, destinationIndex, list, setList) => {
    let vehicling = [];
    let max_distance = [];
    // let speed =[]
    if (options) {
      for (let index = 0; index < options.length; index++) {
        vehicling.push(options[index].name);
        // total_no.push(options[index].total_no)
        max_distance.push(options[index].max_distance);
        // speed.push(options[index].speed)
      }
      return (
        <div className="mt-2">
          {vehicling.map((option, index) => {
            const isAvailable = availableVehicles[option] > 0;
            return (
              <div className="form-check" key={index}>
                <input
                  className="form-check-input"
                  type="radio"
                  name={`destination-${destinationIndex}`}
                  id={`radio-${index}-${destinationIndex}`}
                  value={option}
                  checked={list[destinationIndex] === option}
                  onChange={(event) => {
                    const value = event.target.value;
                    const newList = [...list];

                    const vehicleDistance = vehicles.find(
                      (e) => e.name === value
                    )?.max_distance;
                    if (vehicleDistance >= planetDistance[destinationIndex]) {
                      newList[destinationIndex] = value;
                      setList(newList);
                      setAvailableVehicles((prevAvailableVehicles) => ({
                        ...prevAvailableVehicles,
                        [value]: prevAvailableVehicles[value] - 1,
                      }));
                    } else {
                      enqueueSnackbar(
                        "Vehicle distance should be greater than Planet distance",
                        { variant: "error" }
                      );
                    }
                  }}
                  disabled={!isAvailable} // Disable the radio button if the vehicle is not available
                />
                <label
                  className="form-check-label"
                  htmlFor={`radio-${index}-${destinationIndex}`}
                >
                  {`(${availableVehicles[option]})  `}
                  {`${option} `}
                  {vehicles.find((e) => e.name === option)?.max_distance}
                </label>
              </div>
            );
          })}
        </div>
      );
    }
  };

  //This useEffect will update setAvailableVehicles
  useEffect(() => {
    const updatedAvailableVehicles = { ...initialAvailableVehicles };
    planetList.forEach((planet) => {
      if (planet && vehicleList[planetList.indexOf(planet)]) {
        updatedAvailableVehicles[vehicleList[planetList.indexOf(planet)]]--;
      }
    });
    setAvailableVehicles(updatedAvailableVehicles);
  }, [planetList, vehicleList, initialAvailableVehicles]);

  return (
    <>
      <div className="main">
        <header>
          <div className="d-flex bd-highlight">
            <div className="p-2 flex-fill bd-highlight"></div>
            <div className="p-2 me-5 flex-fill bd-highlight">
              <h1 className="text-center align-self-center">Finding Falcon!</h1>
            </div>
            <div className="p-1 mx-5 d-flex ">
              <p className="ms-2 underhover" onClick={reset}>
                Reset
              </p>
              <p className="mx-2 ">|</p>
              <a href="https://www.geektrust.com/" class="ms-2 underhover">
                Greek Trust Home
              </a>
            </div>
          </div>
          <div className="container fluid">
        <Modal
          show={showSuccessModal}
          onHide={() => setShowSuccessModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Planet Found : {foundPlanet}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{gotMessage}</Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
        </header>
          <div className="container scroll-container">
            <div>
              <h3 className="my-4 me-5">
                Select the planets you want to search in:
              </h3>
              <div
                className="container d-flex justify-content-center me-4"
                style={{ display: "flex", flexDirection: "row" }}
              >
                <form className="row g-4 d-flex justify-content-center me-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="col-auto" key={index}>
                      <select
                        className="form-select"
                        aria-label={`Destination ${index + 1}`}
                        onChange={(event) => updateList(event, index)}
                        value={planetList[index] || ""}
                      >
                        {planetList[index] ? (
                          <option selected disabled>
                            Destination {index + 1}
                          </option>
                        ) : (
                          <option selected>Destination {index + 1}</option>
                        )}

                        {selectOptions(planets, index)}
                      </select>
                      {planetList[index] &&
                        renderRadioButtons(
                          vehicles,
                          index,
                          vehicleList,
                          setVehicleList
                        )}
                    </div>
                  ))}
                </form>
              </div>
              <div className="mt-5">
                {timetaken > 0 ? (
                  <h3>Time Taken: {timetaken}</h3>
                ) : (
                  <h3>Time Taken: 0</h3>
                )}
              </div>
            </div>
            <div className="container mt-4 d-flex flex-row justify-content-center ">
              <div className=" d-flex flex-column align-items-start me-5">
                <h2>Selected Planets:</h2>
                <ul>
                  {planetList.map((planet, index) => {
                  const distances = planets.map((e) => {
                    const { name, distance } = e;
                    if (planet === name) {
                      planetDistance[index] = distance;
                      return distance;
                    }
                    return null;
                  });
                    return (
                      <p key={index}>
                        {planet} {distances}
                      </p>
                    );
                  })}
                </ul>
              </div>
              <div className=" d-flex flex-column align-items-start ">
                <h2>Selected vehicle:</h2>
                <ul>
                  {planetList.map((planet, index) => {
                        const calSpeed = vehicles.find((e) => {
                          const { name, speed } = e;
                          if (vehicleList[index]) {
                            if (name === vehicleList[index]) {
                              return speed;
                            }
                            return null
                          } 
                            return null
                        });
                    vehicleSpeed[index] = calSpeed;
                    return (
                      <p key={index}>
                        {" "}
                        {vehicleList[index] || "Select vehicle"}
                      </p>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="d-flex justify-content-center  ">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={result}
              >
                Find Falcon!
              </button>
            </div>
          </div>
        <footer className="text-center footer">
          <p>
            Coding Problem:{" "}
            <a
              href="https://www.geektrust.com/finding-falcon"
              className="underhover"
            >
              www.geektrust.com/finding-falcon
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}

export default FindingFalcon;


//   const result = async () => {
//     try {
//       // Call the getToken function to get the token
//       const authToken = await getToken();

//       console.log(authToken, planetList, vehicleList);

//       if (authToken) {
//         const requestBody = {
//           token: authToken,
//           planet_names: planetList,
//           vehicle_names: vehicleList,
//         };

//         // Set headers for the request
//         const headers = {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         };

//         // Make the POST request to find falcone API
//         const response = await axios.post(
//           "https://findfalcone.geektrust.com/find",
//           requestBody,
//           { headers }
//         );

//         console.log(response);

//         if (response.status === 200 && response.data.status === "success") {
//           findingPlanet(
//             `Congratulations! You have successfully found Queen Al Falcone on the ${response.data.planet_name} Planet.`
//           );
//           gettingStatus(response.data.status);
//           setShowSuccessModal(true);
//         } else if (
//           response.status === 200 &&
//           response.data.status === "false"
//         ) {
//           gettingStatus(response.data.status);
//           findingPlanet(
//             "YOU LOST! You were unable to find Queen Al Falcone, Now she exiled for another 15 years…."
//           );
//           setShowSuccessModal(true);
//         }
//       }
//     } catch (error) {
//       if (error.response) {
//         enqueueSnackbar(error.response.error, { variant: "error" });
//       } else {
//         enqueueSnackbar(
//           "Something went wrong, Check that the backend is running, reachable and return valid JSON.",
//           { variant: "error" }
//         );
//       }
//     }
//   };

//   const selectOptions = (planet, dropdownIndex) => {
//     let planetsName = [];
//     let planetsDistance = [];

//     if (planet) {
//       for (let index = 0; index < planet.length; index++) {
//         planetsName.push(planet[index].name);
//         planetsDistance.push(planet[index].distance);
//       }
//       const selectedPlanet = planetList[dropdownIndex];
//       return planetsName.map((option, index) => {
//         if (dropdownIndex === 0 && index === 0 && selectedPlanet) {
//           return (
//             <option key={index} value={option} disabled>
//               {option}
//             </option>
//           );
//         } else if (
//           selectedDropdownIndexes[dropdownIndex] === index &&
//           option === selectedPlanet
//         ) {
//           return (
//             <option key={index} value={option} selected>
//               {option}
//             </option>
//           );
//         } else if (
//           !planetList.includes(option) &&
//           !vehicleList[dropdownIndex]
//         ) {
//           return (
//             <option key={index} value={option}>
//               {option}
//             </option>
//           );
//         } else {
//           return (
//             <option key={index} value={option} disabled>
//               {option}
//             </option>
//           );
//         }
//       });
//     }
//   };

//   const updateList = (event, destinationIndex) => {
//     const value = event.target.value;
//     const newList = [...planetList];
//     if (!newList.includes(value)) {
//       newList[destinationIndex] = value;
//       setPlanetList(newList);
//       renderRadioButtons(
//         vehicles,
//         destinationIndex,
//         vehicleList,
//         setVehicleList
//       );
//     }
//     setSelectedDropdownIndexes((prevIndexes) => {
//       const newIndexes = [...prevIndexes];
//       newIndexes[destinationIndex] = planets.indexOf(value); // Update the selected planet index for the dropdown
//       return newIndexes;
//     });
//   };

//   const renderRadioButtons = (options, destinationIndex, list, setList) => {
//     let vehicling = [];
//     let max_distance = [];
//     // let speed =[]
//     if (options) {
//       for (let index = 0; index < options.length; index++) {
//         vehicling.push(options[index].name);
//         // total_no.push(options[index].total_no)
//         max_distance.push(options[index].max_distance);
//         // speed.push(options[index].speed)
//       }
//       return (
//         <div className="mt-2">
//           {vehicling.map((option, index) => {
//             const isAvailable = availableVehicles[option] > 0;
//             return (
//               <div className="form-check" key={index}>
//                 <input
//                   className="form-check-input"
//                   type="radio"
//                   name={`destination-${destinationIndex}`}
//                   id={`radio-${index}-${destinationIndex}`}
//                   value={option}
//                   checked={list[destinationIndex] === option}
//                   onChange={(event) => {
//                     const value = event.target.value;
//                     console.log(value);
//                     const newList = [...list];

//                     const vehicleDistance = vehicles.find(
//                       (e) => e.name === value
//                     )?.max_distance;
//                     if (vehicleDistance >= planetDistance[destinationIndex]) {
//                       newList[destinationIndex] = value;
//                       setList(newList);
//                       setAvailableVehicles((prevAvailableVehicles) => ({
//                         ...prevAvailableVehicles,
//                         [value]: prevAvailableVehicles[value] - 1,
//                       }));
//                     } else {
//                       enqueueSnackbar(
//                         "Vehicle distance should be greater than Planet distance",
//                         { variant: "error" }
//                       );
//                     }
//                     console.log(vehicleSpeed, planetDistance);
//                   }}
//                   disabled={!isAvailable} // Disable the radio button if the vehicle is not available
//                 />
//                 <label
//                   className="form-check-label"
//                   htmlFor={`radio-${index}-${destinationIndex}`}
//                 >
//                   {`(${availableVehicles[option]})  `}
//                   {`${option} `}
//                   {vehicles.map((e) => {
//                     const { name } = e;
//                     const { max_distance } = e;
//                     if (option === name) {
//                       return max_distance;
//                     }
//                   })}
//                 </label>
//               </div>
//             );
//           })}
//         </div>
//       );
//     }
//   };

//   useEffect(() => {
//     const updatedAvailableVehicles = { ...initialAvailableVehicles };
//     planetList.forEach((planet) => {
//       if (planet && vehicleList[planetList.indexOf(planet)]) {
//         updatedAvailableVehicles[vehicleList[planetList.indexOf(planet)]]--;
//       }
//     });
//     setAvailableVehicles(updatedAvailableVehicles);
//   }, [planetList, vehicleList]);

//   return (
//     <>
//       <div className="container fluid">
//         <Modal
//           show={showSuccessModal}
//           onHide={() => setShowSuccessModal(false)}
//         >
//           <Modal.Header closeButton>
//             <Modal.Title>{gotStatus}!</Modal.Title>
//           </Modal.Header>
//           <Modal.Body>{fountPlanet}</Modal.Body>
//           <Modal.Footer>
//             <Button
//               variant="secondary"
//               onClick={() => setShowSuccessModal(false)}
//             >
//               Close
//             </Button>
//           </Modal.Footer>
//         </Modal>
//       </div>
//       <div class="main">
//         <header>
//           <div class="d-flex bd-highlight">
//             <div class="p-2 flex-fill bd-highlight"></div>
//             <div class="p-2 me-5 flex-fill bd-highlight">
//               <h1 class="text-center align-self-center">Finding Falcon!</h1>
//             </div>
//             <div class="p-1 mx-5 d-flex ">
//               <p class="ms-2 underhover" onClick={reset}>
//                 Reset
//               </p>
//               <p class="mx-2 ">|</p>
//               <a href="https://www.geektrust.com/" class="ms-2 underhover">
//                 Greek Trust Home
//               </a>
//             </div>
//           </div>
//         </header>
//         <div class="container">
//           <div>
//             <h3 className="my-4 me-5">
//               Select the planets you want to search in:
//             </h3>
//             <div
//               className="container d-flex justify-content-center me-4"
//               style={{ display: "flex", flexDirection: "row" }}
//             >
//               <form className="row g-4 d-flex justify-content-center me-2">
//                 {Array.from({ length: 4 }).map((_, index) => (
//                   <div className="col-auto" key={index}>
//                     <select
//                       className="form-select"
//                       aria-label={`Destination ${index + 1}`}
//                       onChange={(event) => updateList(event, index)}
//                       value={planetList[index] || ""}
//                     >
//                       {planetList[index] ? (
//                         <option selected disabled>
//                           Destination {index + 1}
//                         </option>
//                       ) : (
//                         <option selected>Destination {index + 1}</option>
//                       )}

//                       {selectOptions(planets, index)}
//                     </select>
//                     {planetList[index] &&
//                       renderRadioButtons(
//                         vehicles,
//                         index,
//                         vehicleList,
//                         setVehicleList
//                       )}
//                   </div>
//                 ))}
//               </form>
//             </div>
//             <div className="mt-5">
//               {timetaken > 0 ? (
//                 <h3>Time Taken: {timetaken}</h3>
//               ) : (
//                 <h3>Time Taken: 0</h3>
//               )}
//             </div>
//           </div>
//           <div className="container mt-5 d-flex flex-row justify-content-center ">
//             <div className=" d-flex flex-column align-items-start me-5">
//               <h2>Selected Planets:</h2>
//               <ul>
//                 {planetList.map((planet, index) => {
//                   let distances = planets.map((e) => {
//                     let { name } = e;
//                     let { distance } = e;
//                     if (planet === name) {
//                       planetDistance[index] = distance;
//                       return distance;
//                     }
//                   });
//                   return (
//                     <>
//                       <p key={index}>
//                         {planet} {distances}
//                       </p>
//                     </>
//                   );
//                 })}
//               </ul>
//             </div>
//             <div className=" d-flex flex-column align-items-start ">
//               <h2>Selected vehicle:</h2>
//               <ul>
//                 {planetList.map((planet, index) => {
//                   const calSpeed = vehicles.find((e) => {
//                     let { name } = e;
//                     let { speed } = e;
//                     if (vehicleList[index]) {
//                       if (name === vehicleList[index]) {
//                         return speed;
//                       }
//                     }
//                   });
//                   vehicleSpeed[index] = calSpeed;
//                   return (
//                     <p key={index}> {vehicleList[index] || "Select vehicle"}</p>
//                   );
//                 })}
//               </ul>
//             </div>
//           </div>
//         </div>
//            <div>
//            <div class="d-flex justify-content-center mt-5 ">
//               <button
//                 type="button"
//                 class="btn btn-primary btn-lg"
//                 onClick={result}
//               >
//                 Find Falcon!
//               </button>
//             </div>
//             <footer className="text-center footer">
//               <p>
//                 Coding Problem:{" "}
//                 <a
//                   href="https://www.geektrust.com/finding-falcon"
//                   class="underhover"
//                 >
//                   www.geektrust.com/finding-falcon
//                 </a>
//               </p>
//             </footer>
//            </div>
//       </div>
//     </>
//   );
// }

// export default FindingFalcon;
