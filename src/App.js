import { useEffect, useState } from "react";
import moment from "moment";
import d2d from "degrees-to-direction";
import Button from "@mui/material/Button";
import GoogleMapReact from "google-map-react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import beaufort from "beaufort-scale";
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";

import { Line } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

function App() {
  const GEO_APP_ID = "pk.37f5d005dffd571ae26bdd5aee9e9870";
  const [error, setError] = useState("");
  const [searchCity, setSearchCity] = useState(
    JSON.parse(localStorage.getItem("searchCity")) || "rabat"
  );

  const APP_ID = "4c114062ddcde2bf0ca5f8f776d41175";
  const mapAPI = "AIzaSyAZXz3Ia4i5clZp49tW8DeY9MewmCuJA-I";
  const [city, setCity] = useState("");

  const [cities, setCities] = useState({});
  const [sCity, setSCity] = useState({});
  const [maxMin, setMaxMin] = useState([]);
  const [selected, setSelected] = useState("metric");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveLocalSearchCity = () => {
    localStorage.setItem("searchCity", JSON.stringify(searchCity));
  };
  useEffect(() => {
    saveLocalSearchCity();
  }, [searchCity]);

  const getLocalSearchCity = () => {
    if (localStorage.getItem("searchCity") === null)
      localStorage.setItem("searchCity", JSON.stringify([]));
    else {
      setSearchCity(JSON.parse(localStorage.getItem("searchCity")));
    }
  };
  useEffect(() => {
    getLocalSearchCity();
  }, []);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getCityLatLng = async () => {
    if (city === "" && searchCity === "") {
      setError("");
      setError("City's name is required");
    } else {
      const cityLatLng = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&units=${selected}&appid=${APP_ID}`
      );
      const localization = await cityLatLng.json();

      if (localization?.cod === "404") {
        setError("");
        setError("Not found. To make search more precise put the city's name");
      } else {
        setLoading(true);
        setError("");
        setSCity(localization);
        const { lat, lon } = localization.coord;

        const cities = await fetch(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${selected}&appid=${APP_ID}`
        );
        const cityData = await cities.json();
        setMaxMin(cityData?.hourly?.map((h) => Math.round(h?.temp)));

        setCities(cityData);
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    getCityLatLng();
  }, [selected]);

  const mapCenter = {
    center: {
      lat: cities?.lat,
      lng: cities?.lon,
    },
    zoom: 10,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        ticks: {
          color: "#ffffff",
        },
      },
      y: {
        min: Math.min(...maxMin?.slice(0, 12)),
        max: Math.max(...maxMin?.slice(0, 12)),

        ticks: {
          color: "#ffffff",
        },
      },
    },
  };

  const labels = cities?.hourly
    ?.slice(0, 12)
    .map((h) => moment.unix(h?.dt).format("ha"));
  const data = {
    labels,
    datasets: [
      {
        data: cities?.hourly?.slice(0, 12).map((h) => Math.round(h?.temp)),
        borderColor: "#E25A78",
        // backgroundColor: "#ff729830",fill: true,
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      },
      // {
      //   type: "bar",
      //   data: cities?.hourly?.map(
      //     (h) =>
      //       (((Math.min(...maxMin) - h?.rain?.["1h"]) / Math.min(...maxMin)) *
      //         100 *
      //         Math.max(...maxMin)) /
      //       100
      //   ),
      //   backgroundColor: "#ff729870",
      //   borderRadius: 1,
      //   barThickness: 10,
      // },
    ],
  };

  const getCurrentCityLatLng = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
    } else {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setError("");
          const location = await fetch(
            `https://us1.locationiq.com/v1/reverse.php?key=${GEO_APP_ID}&lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const currentPosition = await location.json();
          setSearchCity(currentPosition.address.city);
          const cityLatLng = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${currentPosition.address.city}&units=${selected}&appid=${APP_ID}`
          );
          const localization = await cityLatLng.json();

          if (localization?.cod === "404") {
            setError("");
            setError(
              "Not found. To make search more precise put the city's name"
            );
          } else {
            setError("");
            setSCity(localization);
            const { lat, lon } = localization.coord;
            const cities = await fetch(
              `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${selected}&appid=${APP_ID}`
            );
            const cityData = await cities.json();
            setMaxMin(cityData?.hourly?.map((h) => Math.round(h?.temp)));
            setCities(cityData);
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
          setError("Unable to retrieve your location");
        }
      );
    }
  };

  return (
    <div
      className=" 2xl:text-2xl flex justify-center items-center flex-wrap w-full 
    h-screen overflow-y-scroll bg-[#131921] space-y-[8px]   p-1 scrollbar-hide"
    >
      <div
        className=" shadow shadow-[#1f202b] flex justify-between items-center 
      flex-wrap-reverse w-full lg:w-[80%]   bg-[#1B1C25] rounded p-2"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCity("");
            getCityLatLng();
          }}
          className=" w-full md:w-[60%]"
        >
          <Input
            disableUnderline
            placeholder="Search"
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value.trimStart());
              setSearchCity(e.target.value.trimStart());
            }}
            className="w-full rounded bg-white  outline-none    2xl:h-[50px]"
            endAdornment={
              <InputAdornment position="end">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    setCity("");
                    getCityLatLng();
                  }}
                  variant="text"
                  className="text-[#E25A78]"
                >
                  {loading ? (
                    <CircularProgress color="inherit" size={25} />
                  ) : (
                    <SearchIcon />
                  )}
                </Button>
              </InputAdornment>
            }
            startAdornment={
              <InputAdornment position="start">
                <Button
                  onClick={getCurrentCityLatLng}
                  variant="text"
                  className="text-[#E25A78]"
                >
                  <svg
                    className={`w-5 h-5  cursor-pointer `}
                    viewBox="0 0 1000 1000"
                  >
                    <path
                      fill="#E25A78"
                      d="M551.4,990.8c-1.4,0-2.8-0.1-4.3-0.3c-13.5-1.9-24.2-12.6-26.1-26.1L477,522.2L36.4,478.9c-13.6-1.9-24.2-12.5-26.1-26.1c-1.9-13.6,5.4-26.7,17.9-32.3L946.9,11.8c11.6-5.1,25.1-2.6,34.1,6.3c9,9,11.5,22.5,6.3,34.2l-408,920.3C574.4,983.8,563.4,990.8,551.4,990.8L551.4,990.8z M125.5,428.5l367.2,52.6c13.6,1.9,24.2,12.6,26.1,26.1l51.9,366.5L922.2,77L125.5,428.5z"
                    />
                  </svg>
                </Button>
              </InputAdornment>
            }
          />

          <p className="text-[#E25A78] animate-pulse">{error && error}</p>
          <input type="submit" hidden />
        </form>

        <div className="w-full md:w-[35%] mb-2 md:mb-0">
          <div className=" flex justify-between items-center bg-[#ff638580] p-1 rounded">
            <Button
              variant="text"
              className={`2xl:h-[45px] 2xl:text-lg text-[10px] p-1 w-[45%] ${
                selected === "metric" && "bg-[#E25A78]"
              } text-black`}
              onClick={() => setSelected("metric")}
            >
              Metric: °C, m/s
            </Button>
            <Button
              variant="text"
              className={`2xl:h-[45px] 2xl:text-lg text-[10px] p-1 w-[45%] ${
                selected !== "metric" && "bg-[#E25A78]"
              } text-black`}
              onClick={() => setSelected("imperial")}
            >
              Imperial: °F, mph
            </Button>
          </div>
        </div>
      </div>
      <div
        className="2xl:h-[400px] shadow shadow-[#1f202b] xl:min-h-[240px] flex justify-between 
      items-center  flex-wrap  text-white bg-[#1B1C25] w-full lg:w-[80%]  p-3 rounded"
      >
        <div className=" w-full md:w-[35%] h-full flex flex-col justify-evenly mb-5 md:mb-0">
          <div className="w-full">
            <h2 className="text-sm text-[#E25A78]">
              {moment.unix(cities?.current?.dt).format("MMM DD, hh:mma")}
            </h2>
            <h1 className="text-lg font-semibold">
              {sCity?.name}, {sCity?.sys?.country}
            </h1>
          </div>

          <div className="flex justify-start items-center">
            <img
              src={`https://openweathermap.org/img/wn/${cities?.current?.weather?.[0]?.icon}@2x.png`}
              alt="tempirature"
              className="w-12 h-12 mr-1 truncate"
            />
            <span className="text-3xl font-semibold">
              {Math.round(cities?.current?.temp)}
              {selected === "metric" ? "°C" : "°F"}
            </span>
          </div>

          <h1 className="font-semibold capitalize">
            Feels like {Math.round(cities?.current?.feels_like)}
            {selected === "metric" ? "°C" : "°F"}.{" "}
            {cities?.current?.weather[0]?.description}.{" "}
            {selected === "metric"
              ? beaufort((Math.round(cities?.current?.wind_speed) * 18) / 5)
                  ?.desc
              : beaufort(Math.round(cities?.current?.wind_speed) * 1.609344)
                  ?.desc}
          </h1>

          <div className="border-l-[1px] border-l-[#E25A78] px-6">
            <div className="flex items-center justify-between w-full ">
              <div className="flex items-center  w-[50%] ">
                <svg
                  viewBox="0 0 1000 1000"
                  enableBackground="new 0 0 1000 1000"
                  className={`w-3 h-3 mr-2 `}
                  style={{
                    transform: `rotate(${cities?.current?.wind_deg + 180}deg)`,
                  }}
                >
                  <g fill="#ffffff">
                    <path d="M510.5,749.6c-14.9-9.9-38.1-9.9-53.1,1.7l-262,207.3c-14.9,11.6-21.6,6.6-14.9-11.6L474,48.1c5-16.6,14.9-18.2,21.6,0l325,898.7c6.6,16.6-1.7,23.2-14.9,11.6L510.5,749.6z"></path>
                    <path d="M817.2,990c-8.3,0-16.6-3.3-26.5-9.9L497.2,769.5c-5-3.3-18.2-3.3-23.2,0L210.3,976.7c-19.9,16.6-41.5,14.9-51.4,0c-6.6-9.9-8.3-21.6-3.3-38.1L449.1,39.8C459,13.3,477.3,10,483.9,10c6.6,0,24.9,3.3,34.8,29.8l325,898.7c5,14.9,5,28.2-1.7,38.1C837.1,985,827.2,990,817.2,990z M485.6,716.4c14.9,0,28.2,5,39.8,11.6l255.4,182.4L485.6,92.9l-267,814.2l223.9-177.4C454.1,721.4,469,716.4,485.6,716.4z"></path>
                  </g>
                </svg>

                <span>
                  {cities?.current?.wind_speed.toFixed(1)}m/s{" "}
                  {d2d(cities?.current?.wind_deg)}
                </span>
              </div>
              <div className="flex items-center text-left w-[40%]">
                <svg className="mr-1 w-[15px] h-[15px]" viewBox="0 0 96 96">
                  <g
                    transform="translate(0,96) scale(0.100000,-0.100000)"
                    fill="#ffffff"
                    stroke="none"
                  >
                    <path
                      d="M351 854 c-98 -35 -179 -108 -227 -202 -27 -53 -29 -65 -29 -172 0
    -107 2 -119 29 -172 38 -75 104 -141 180 -181 58 -31 66 -32 176 -32 110 0
    118 1 175 32 77 40 138 101 178 178 31 57 32 65 32 175 0 110 -1 118 -32 176
    -40 76 -106 142 -181 179 -49 25 -71 29 -157 32 -73 2 -112 -1 -144 -13z m259
    -80 c73 -34 126 -86 161 -159 24 -50 29 -73 29 -135 0 -62 -5 -85 -29 -135
    -57 -119 -161 -185 -291 -185 -130 0 -234 66 -291 185 -24 50 -29 73 -29 135
    0 130 66 234 185 291 82 40 184 41 265 3z"
                    ></path>
                    <path
                      d="M545 600 c-35 -35 -68 -60 -80 -60 -27 0 -45 -18 -45 -45 0 -33 -50
    -75 -89 -75 -18 0 -41 -5 -53 -11 -20 -11 -20 -11 3 -35 12 -13 33 -24 46 -24
    17 0 23 -6 23 -23 0 -13 10 -33 23 -45 30 -28 47 -13 47 43 0 32 6 47 28 68
    15 15 37 27 48 27 26 0 44 18 44 44 0 12 26 47 60 81 l60 61 -28 27 -28 27
    -59 -60z"
                    ></path>
                  </g>
                </svg>
                <span>{sCity?.main?.pressure}hPa</span>
              </div>
            </div>

            <div className="flex items-center justify-between w-full ">
              <p className=" w-[50%]">Humidity: {cities?.current?.humidity}%</p>
              <p className="text-left w-[40%]">
                UV: {Math.round(cities?.current?.uvi).toFixed(0)}
              </p>
            </div>

            <div className="flex items-center justify-between w-full ">
              <p className=" w-[50%]">
                Dew points: {Math.round(cities?.current?.dew_point)}
                {selected === "metric" ? "°C" : "°F"}
              </p>
              <p className="text-left w-[40%]">
                Visibility: {(cities?.current?.visibility / 1000).toFixed(1)}km
              </p>
            </div>
          </div>
        </div>

        <div className="w-full 2xl:h-full md:w-[55%] h-[210px] ">
          <GoogleMapReact
            bootstrapURLKeys={{
              key: mapAPI,
            }}
            center={mapCenter.center}
            defaultZoom={mapCenter.zoom}
          />
        </div>
      </div>
      <div
        className="2xl:h-[500px] shadow shadow-[#1f202b] xl:min-h-[340px]  
      w-full lg:w-[80%] h-[340px] flex justify-between items-center flex-wrap "
      >
        <div className="overflow-x-scroll scrollbar-hide w-full lg:w-[60%] h-full mb-2 lg:mb-0">
          <Line
            className=" p-2 h-full min-w-[650px] w-full bg-[#1B1C25] rounded"
            options={options}
            data={data}
          />
        </div>
        <div className="w-full lg:w-[37%] h-full overflow-y-scroll scrollbar-hide">
          {cities?.daily?.map((day) => (
            <Accordion
              key={day?.dt}
              className="shadow shadow-[#1f202b] bg-[#1B1C25] text-white p-0 "
              expanded={expanded === day?.dt}
              onChange={handleChange(day?.dt)}
            >
              <AccordionSummary
                className="2xl:h-auto h-8 m-0 w-full px-[3px] py-0  "
                expandIcon={<ArrowDropDownIcon className="text-white" />}
              >
                <div className=" w-full h-full flex items-center justify-between px-[5px]">
                  <p className="w-[33%] font-medium">
                    {moment.unix(day?.dt).format("ddd, MMM DD")}
                  </p>

                  <div className="w-[33%] flex items-center">
                    <img
                      src={`https://openweathermap.org/img/wn/${day?.weather?.[0]?.icon}@2x.png`}
                      alt="tempirature icon"
                      className="w-10 h-10"
                    />
                    <p className="">
                      {Math.round(day?.temp?.max)}/{Math.round(day?.temp?.min)}
                      {selected === "metric" ? "°C" : "°F"}
                    </p>
                  </div>

                  <p className="w-[33%] text-sm 2xl:text-xl text-gray-500 text-right">
                    {day?.weather?.[0]?.description}
                  </p>
                </div>
              </AccordionSummary>
              <AccordionDetails className="h-full m-0">
                <div className="w-full h-full flex flex-col px-1 space-y-3">
                  <div className="flex items-center ">
                    <img
                      src={`https://openweathermap.org/img/wn/${day?.weather?.[0]?.icon}@2x.png`}
                      alt="tempirature icon"
                      className="w-12 h-12 mr-1"
                    />
                    <div className="">
                      <p className="font-bold capitalize mb-1">
                        {day?.weather?.[0]?.description}.{" "}
                        {selected === "metric"
                          ? beaufort((Math.round(day?.wind_speed) * 18) / 5)
                              ?.desc
                          : beaufort(Math.round(day?.wind_speed) * 1.609344)
                              ?.desc}
                        .
                      </p>
                      <p className="">
                        The high will be {Math.round(day?.temp?.max)}
                        {selected === "metric" ? "°C" : "°F"}, the low will be{" "}
                        {Math.round(day?.temp?.min)}
                        {selected === "metric" ? "°C" : "°F"}.
                      </p>
                    </div>
                  </div>
                  <div className="border-l-[1px] border-l-[#E25A78]">
                    <div className="flex items-center justify-around  ">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 " viewBox="0 0 512 512">
                          <g fill="#fff">
                            <path d="M142.5 25.1C85.3 33.9 36.6 72.5 15.1 126c-8.6 21.4-11.5 39.2-10.9 65.4.4 15 1 20.1 3.2 30 4.8 20.9 12 37.5 24 55.6 9.1 13.7 29.2 34 42.6 42.9 23 15.4 49.3 25 75.3 27.6l6.7.7v73l3.4 3.4c3 3 4 3.4 8.6 3.4s5.6-.4 8.6-3.4l3.4-3.4V348h176v73.2l3.4 3.4c3 3 4 3.4 8.6 3.4s5.6-.4 8.6-3.4l3.4-3.4V348h19.3c14.8 0 21.3-.5 28.2-1.9 39.4-8.1 70.5-39.4 78.7-79.1 2.9-13.9 2.1-36.8-1.7-49.5-10.9-36.7-40.5-64.1-77.4-71.7-7.9-1.6-12.2-1.9-24.6-1.5-18.4.6-26.6 2.5-42 10.1-23.4 11.6-41.7 31.4-50.1 54.2-3.2 8.9-2.8 13.3 1.8 17.6 2.5 2.4 3.9 2.8 8.4 2.8 6.9 0 10-2.8 13.9-12.3 17-41.5 65.6-59.8 106-39.8 38 18.9 53.5 65.3 34.6 103.6-9.9 20-27.8 34.4-50.6 40.8l-8 2.2h-131c-146.5 0-140 .3-162.5-7.2-34.3-11.4-64.4-37.6-80.1-69.8-9.8-20.2-13.9-38-13.9-60.5 0-37.4 13.5-70 40.1-96.7 26.3-26.4 59.6-40.3 96.6-40.4 37 0 71 13.9 96.8 39.6 11 11.1 18.6 21.6 26.3 36.5 4.6 9 6.5 11.7 9.3 13.2 7.6 4.2 16.6-.6 17.6-9.4.4-3.8-.1-5.9-3.4-12.9-17.8-37.9-51.1-68.2-90.9-82.8-4.4-1.6-13.4-4.2-20-5.7-10.6-2.4-14.2-2.8-32.4-3-11.3-.1-23.2.2-26.5.7z"></path>
                            <path d="M259.4 387.4l-3.4 3.4v90.4l3.4 3.4c3 3 4 3.4 8.6 3.4s5.6-.4 8.6-3.4l3.4-3.4v-90.4l-3.4-3.4c-3-3-4-3.4-8.6-3.4s-5.6.4-8.6 3.4z"></path>
                          </g>
                        </svg>
                        {day?.rain}mm(
                        {Math.round(day?.pop * 100)}
                        %)
                      </div>
                      <div className="flex items-center">
                        <svg
                          viewBox="0 0 1000 1000"
                          enableBackground="new 0 0 1000 1000"
                          className="w-3 h-3 mr-2"
                          style={{
                            transform: `rotate(${day?.wind_deg + 180}deg)`,
                          }}
                        >
                          <g fill="#fff">
                            <path d="M510.5,749.6c-14.9-9.9-38.1-9.9-53.1,1.7l-262,207.3c-14.9,11.6-21.6,6.6-14.9-11.6L474,48.1c5-16.6,14.9-18.2,21.6,0l325,898.7c6.6,16.6-1.7,23.2-14.9,11.6L510.5,749.6z"></path>
                            <path d="M817.2,990c-8.3,0-16.6-3.3-26.5-9.9L497.2,769.5c-5-3.3-18.2-3.3-23.2,0L210.3,976.7c-19.9,16.6-41.5,14.9-51.4,0c-6.6-9.9-8.3-21.6-3.3-38.1L449.1,39.8C459,13.3,477.3,10,483.9,10c6.6,0,24.9,3.3,34.8,29.8l325,898.7c5,14.9,5,28.2-1.7,38.1C837.1,985,827.2,990,817.2,990z M485.6,716.4c14.9,0,28.2,5,39.8,11.6l255.4,182.4L485.6,92.9l-267,814.2l223.9-177.4C454.1,721.4,469,716.4,485.6,716.4z"></path>
                          </g>
                        </svg>

                        <p>
                          {day?.wind_speed.toFixed(1)}m/s {d2d(day?.wind_deg)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="mr-1 w-[15px] h-[15px]"
                          viewBox="0 0 96 96"
                        >
                          <g
                            transform="translate(0,96) scale(0.100000,-0.100000)"
                            fill="#fff"
                            stroke="none"
                          >
                            <path
                              d="M351 854 c-98 -35 -179 -108 -227 -202 -27 -53 -29 -65 -29 -172 0
                              -107 2 -119 29 -172 38 -75 104 -141 180 -181 58 -31 66 -32 176 -32 110 0
                              118 1 175 32 77 40 138 101 178 178 31 57 32 65 32 175 0 110 -1 118 -32 176
                              -40 76 -106 142 -181 179 -49 25 -71 29 -157 32 -73 2 -112 -1 -144 -13z m259
                              -80 c73 -34 126 -86 161 -159 24 -50 29 -73 29 -135 0 -62 -5 -85 -29 -135
                              -57 -119 -161 -185 -291 -185 -130 0 -234 66 -291 185 -24 50 -29 73 -29 135
                              0 130 66 234 185 291 82 40 184 41 265 3z"
                            ></path>
                            <path
                              d="M545 600 c-35 -35 -68 -60 -80 -60 -27 0 -45 -18 -45 -45 0 -33 -50
                                -75 -89 -75 -18 0 -41 -5 -53 -11 -20 -11 -20 -11 3 -35 12 -13 33 -24 46 -24
                                17 0 23 -6 23 -23 0 -13 10 -33 23 -45 30 -28 47 -13 47 43 0 32 6 47 28 68
                                15 15 37 27 48 27 26 0 44 18 44 44 0 12 26 47 60 81 l60 61 -28 27 -28 27
                                -59 -60z"
                            ></path>
                          </g>
                        </svg>
                        <span>{day?.pressure}hPa</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-around  ">
                      <div className="">Humidity: {day?.humidity}%</div>
                      <div className="">
                        UV: {Math.round(day?.uvi).toFixed(0)}
                      </div>
                      <div className="">
                        Dew points: {Math.round(day?.dew_point)}
                        {selected === "metric" ? "°C" : "°F"}
                      </div>
                    </div>
                  </div>
                  <table className="text-center">
                    <thead className="">
                      <tr>
                        <th></th>
                        <th className=" font-normal">Morning</th>
                        <th className=" font-normal">Afternoon</th>
                        <th className=" font-normal">Evening</th>
                        <th className=" font-normal">Night</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left">Temperature</td>

                        <td>
                          {Math.round(day?.temp?.morn)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                        <td>
                          {Math.round(day?.temp?.day)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                        <td>
                          {Math.round(day?.temp?.eve)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                        <td>
                          {Math.round(day?.temp?.night)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                      </tr>
                    </tbody>
                    <tbody>
                      <tr>
                        <td className="text-left">Feels like</td>

                        <td>
                          {Math.round(day?.feels_like?.morn)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                        <td>
                          {Math.round(day?.feels_like?.day)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                        <td>
                          {Math.round(day?.feels_like?.eve)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                        <td>
                          {Math.round(day?.feels_like?.morn)}
                          {selected === "metric" ? "°C" : "°F"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex items-center space-x-5">
                    <div className="flex items-center flex-col">
                      <span className="text-[10px] text-[#8a8a8a] ">
                        Sunrise
                      </span>
                      <span>
                        {moment
                          .unix(day?.sunrise)

                          .format("hh:mma")}
                      </span>
                    </div>
                    <div className="flex items-center flex-col">
                      <span className="text-[10px] text-[#8a8a8a] ">
                        Sunset
                      </span>
                      <span>
                        {moment
                          .unix(day?.sunset)

                          .format("hh:mma")}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
