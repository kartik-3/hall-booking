const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const rooms = []; //For locally storing objects

app
  .use(bodyParser.json())
  .get("/rooms", (req, res) => {
    //Gets a list of all the rooms
    getRooms(res);
  })
  .get("/rooms/:id", (req, res) => {
    //Gets all customers of a room
    getCustomers(req, res);
  })
  .post("/rooms", (req, res) => {
    //Creates a new room
    checkRoom(req, res);
  })
  .post("/rooms/:id", (req, res) => {
    //Make a booking for a room
    checkCustomer(req, res);
  })
  .listen(process.env.PORT);

const getRooms = (res) => {
  if (rooms.length < 1) {
    //Check if room exists
    res.status(500).send("No room in the system. Please create rooms first.");
    return;
  }
  let retStr = "";
  rooms.forEach((room) => {
    //Return all required room parameters
    retStr += `<p>Room Number - ${room.roomId}<br/>
          Booked Status - ${room.isBooked}`;
    if (room.isBooked) {
      //Return customer details only if there is a booking
      room.customers.forEach((customer) => {
        retStr += `<br/>Customer Name - ${customer.customerName}<br/>
               Booking Data - ${customer.bookedDate}<br/>
               Start Time - ${customer.bookedStartTime}<br/>
               End Time - ${customer.bookedEndTime}`;
      });
    }
    retStr += `</p>`;
  });
  res.status(200).send(retStr);
};

const getCustomers = (req, res) => {
  if (rooms.length <= req.params.id - 1) {
    //Check if room exists
    res.status(500).send("No such room in the system.");
    return;
  }
  if (rooms[req.params.id - 1].customers.length < 1) {
    //Check if customer exists
    res
      .status(500)
      .send(
        "No valid bookings for the current room. Please book a room first."
      );
    return;
  }
  let retStr = "";
  rooms.forEach((room) => {
    //Return all customer's details
    if (room.roomId == req.params.id) {
      room.customers.forEach((customer) => {
        retStr += `<p>Room Number - ${room.roomId}<br/>
                Customer Name - ${customer.customerName}<br/>
                Booking Data - ${customer.bookedDate}<br/>
                Start Time - ${customer.bookedStartTime}<br/>
                End Time - ${customer.bookedEndTime} </p>`;
      });
    }
  });
  res.status(200).send(retStr);
};

const checkRoom = (req, res) => {
  //Validate the requested room details
  const keys = ["numberOfSeats", "amenities", "price"];
  for (let key in req.body) {
    //Only accept request with above keys
    if (!keys.includes(key)) {
      res.status(500).send("Can not create room with these specifications.");
      return;
    }
  }
  if (
    //Check if all required parameters are present
    !req.body.numberOfSeats ||
    req.body.numberOfSeats < 50 || //Number of seats should be in the range of 50-500
    req.body.numberOfSeats > 500 ||
    !req.body.amenities ||
    req.body.amenities.length < 1 || //There should be at least 1 amenity
    !req.body.price
  ) {
    res.status(500).send("Can not create room with these specifications.");
    return;
  } else {
    req.body.roomId = rooms.length + 1; //All checks passed
    req.body.isBooked = false;
    req.body.customers = [];
    rooms.push(req.body);
    res
      .status(200)
      .send(`Created room with room number ${req.body.roomId} successfully.`);
    return;
  }
};

const checkCustomer = (req, res) => {
  //Validate the requested customer details
  const keys = [
    "customerName",
    "bookedDate",
    "bookedStartTime",
    "bookedEndTime",
  ];
  for (let key in req.body) {
    //Only accept the above keys
    if (!keys.includes(key)) {
      res
        .status(500)
        .send("Incorrect specifications received. Please check your request.");
      return;
    }
  }
  if (
    //These parameters must be present
    !req.body.customerName ||
    !req.body.bookedDate ||
    !req.body.bookedStartTime ||
    !req.body.bookedEndTime
  ) {
    res.status(500).send("No room available with these specifications.");
    return;
  }
  let roomFound = false;
  rooms.forEach((room) => {
    if (room.roomId == req.params.id) {
      //Check if requested room exists
      roomFound = true;
      room.isBooked = true;
      if (
        //Start time should be in the range of 10AM-9PM and end time should be in the range of 11AM-10PM
        req.body.bookedStartTime < 10 ||
        req.body.bookedStartTime > 21 ||
        req.body.bookedEndTime > 22 ||
        req.body.bookedEndTime < 11
      ) {
        res.status(500).send("A room can be booked between 10 AM and 10 PM.");
        return;
      }
      if (room.customers.length > 0) {
        //If a booking exists, check if the room is available in the requested time frame
        let isBadDate = false;
        for (let i = 0; i < room.customers.length; i++) {
          room.customers.forEach((customer) => {
            if (customer.bookedDate == req.body.bookedDate) {
              if (
                (req.body.bookedStartTime >= customer.bookedStartTime &&
                  req.body.bookedStartTime <= customer.bookedEndTime) ||
                (req.body.bookedEndTime <= customer.bookedEndTime &&
                  req.body.bookedEndTime >= customer.bookedStartTime) ||
                req.body.bookedStartTime >= req.body.bookedEndTime
              ) {
                isBadDate = true;
                res
                  .status(500)
                  .send("This room is not available in the given time frame.");
              }
            }
          });
        }
        if (isBadDate) return;
      }
      room.customers.push(req.body); //All checks passed
      res
        .status(200)
        .send(
          `Room number ${req.params.id} booked successfully for Mr/Ms. ${req.body.customerName} on date ${req.body.bookedDate} from ${req.body.bookedStartTime} till ${req.body.bookedEndTime}.`
        );
      return;
    }
  });
  if (!roomFound) {
    //If requested room is not found
    res.status(500).send("No room found with the requested room ID.");
    return;
  }
};
