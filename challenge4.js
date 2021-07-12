{
    init: function(elevators, floors) {
        console.log("=========================")
        console.log("   Starting new run     ")
        console.log("=========================")

        elevator1 = elevators[0]
        elevator2 = elevators[1]
        bottomFloor = 0
        console.log("Bottom floor is: ", bottomFloor)
        topFloor = floors.length - 1
        console.log("Top floor is: ", topFloor)
        elevatorMostlyFullLevel = 0.7   // elevator.loadCapacity == 1 means the elevator is completely full.  

        let state = {
            "upRequestQueue": [],
            "downRequestQueue": [],
            "elevator1": {
                "direction" :"up",
                "defaultFloor" : 1,
                "callPriorities" : ["up", "down"]
            },
            "elevator2": {
                "direction" :"up",
                "defaultFloor" : 4,
                "callPriorities" : ["up", "down"],
            },
        }

        const callEmptyElevator = function (floorNum) {
            // After a floor button press, if there is an empty elevator, send it to that floor.

            el1QueueLen = elevator1.destinationQueue.length
            el2QueueLen = elevator2.destinationQueue.length
            if (el1QueueLen == 0) {
                elevator1.goToFloor(floorNum)
                // console.log("just called elevator1 and its destination queue is: ", elevator1.destinationQueue)
            } else if (el2QueueLen == 0) {
                elevator2.goToFloor(floorNum)
                // console.log("just called elevator2 and its destination queue is: ", elevator2.destinationQueue)
            } else {
                console.log("no elevators were free so none were called for this button push in function callEmptyElevator")
            }
        }

        const setDownSignal = function (elevator) {
            // Turn on the elevator's down light and turn off the elevator's up light

            elevator.goingUpIndicator(false)
            elevator.goingDownIndicator()
        }

        const setUpSignal = function (elevator) {
            // Turn on the elevator's up light and turn off the elevator's down light

            elevator.goingUpIndicator()
            elevator.goingDownIndicator(false)
        }

        const getElevatorDirectionFromState = function(elevator) {
            // Read and return the direction of an elevator from state.  Assumes 2 elevators.
            describedElevator = describeElevator(elevator)
            console.log("just read ", describeElevator(elevator), "'s direction from state and got: ", state[describedElevator]["direction"])
            return state[describedElevator]["direction"]
        }

        const setSignalsForStoppedElevator = function (elevator, floorNum) {
            // Sets the up/down signals for an elevator that's stopped.

            currentFloor = elevator.currentFloor()
            elevatorDirection = getElevatorDirectionFromState(elevator)
            
            if (currentFloor != floorNum) {
                console.warn("Tried to set signals for stopped ", describeElevator(elevator), " but it's in between floors.")
                elevator.goToFloor(floorNum, true)
            } else if (floorNum == topFloor) {
                setDownSignal(elevator)
            } else if (floorNum == bottomFloor) {
                setUpSignal(elevator)
            } else if (elevatorDirection == "up") {
                setUpSignal(elevator)
            } else if (elevatorDirection == "down") {
                setDownSignal(elevator)
            } else {
                console.warn("No state elevator direction found for ", describeElevator(elevator))
            }
        }
        
        const describeElevator = function (elevator) {
            // given an instance of an elevator, return its name
            // Useful for setting state of elevators and for console logging.

            if (elevator == elevator1) {
                return "elevator1"
            } else if (elevator == elevator2) {
                return "elevator2"
            } else {
                return "unknownElevator"
            }
        }
        
        const someoneWantsOff = function (elevator, floorNum) {
            // Returns true if a specific floor button has been pushed on an elevator.
            // Otherwise returns false.

            return elevator.getPressedFloors().includes(floorNum)
        }
        
        const elevatorIsFull = function (elevator) {
            // Do not stop to pick up passengers if we're mostly full.

            return elevator.loadFactor > elevatorMostlyFullLevel
        }
        
        const someoneIsWaiting = function (direction, floorNum) {
            // Returns true if someone on a floor has pressed an up/down button that
            // matches the direction the elevator is going.

            downRequests = state.downRequestQueue
            upRequests = state.upRequestQueue
            
            if ((downRequests.includes(floorNum)) && (direction == "down")) {
                return true
            }
            if ((upRequests.includes(floorNum)) && (direction == "up")) {
                return true
            }
            return false
        }
        
        const stoppingDecision = function (elevator, floorNum) {
            // As an elevator is approaching a floor, decide if it needs to stop there.  Returns true/false

            console.log("checking stopping decision for ", describeElevator(elevator))
            elevatorDirection = getElevatorDirectionFromState(elevator)

            if (someoneWantsOff(elevator, floorNum)) {
                console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is true because someone wants off")
                return true
            } else if (elevatorIsFull(elevator)) {
                console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is false because elevator is full")
                return false
            } else if (someoneIsWaiting(elevatorDirection, floorNum)) {
                console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is true because someone is waiting")
                return true
            }
            console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is false because we reached the end of the decision tree (nobody wants off, elevator is not full, and nobody is waiting) up queue is ", state.upRequestQueue, " and down queue is ", state.downRequestQueue, " and direction is ", elevatorDirection)
            return false
        }
        
        const removeFromElevatorQueue = function (elevator, floorNum) {
            //remove all instances of a particular floorNum from the elevator's destination queue

            floorIndex = elevator.destinationQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                elevator.destinationQueue.splice(floorIndex, 1)
                floorIndex = elevator.destinationQueue.indexOf(floorNum)
            }
            elevator.checkDestinationQueue()
        }
        
        const removeFromUpQueue = function (floorNum) {
            // remove all instances of a particular floorNum from the state's tracking of the floor up-requests

            floorIndex = state.upRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.upRequestQueue.splice(floorIndex, 1)
                floorIndex = state.upRequestQueue.indexOf(floorNum)
            }
        }
        
        const removeFromDownQueue = function (floorNum) {
            // remove all instances of a particular floorNum from the state's tracking of the floor down-requests

            floorIndex = state.downRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.downRequestQueue.splice(floorIndex, 1)
                floorIndex = state.downRequestQueue.indexOf(floorNum)
            }
        }
        
        const updateElevatorDirectionInState = function (elevator, direction) {
            // while the elevator is actually moving (defined as it's passing a floor), set the elevator's state
            // as going either "up" or "down"

            describedElevator = describeElevator(elevator)
            if (direction == "up") {
                state[describedElevator]["direction"] = "up"
            } else if (direction == "down") {
                state[describedElevator]["direction"] = "down"
            } else {
                console.warn("attempted to set state direction for ", describeElevator(elevator), " but direction was neither up nor down")
            }
        }

        const addFirstUpPassenger = function (elevator) {
            // sends the elevator to the first floor in the up request queue stored in state
            // and then removes that floor from the up queue

            floorNum = state.upRequestQueue[0]
            elevator.goToFloor(floorNum)
            removeFromUpQueue(floorNum)
        }

        const addFirstDownPassenger = function (elevator) {
            // sends the elevator to the first floor in the down request queue stored in state
            // and then removes that floor from the down queue

            floorNum = state.downRequestQueue[0]
            elevator.goToFloor(floorNum)
            removeFromDownQueue(floorNum)
        }
        
        const getNextPassenger = function (elevator) {
            // Does nothing if no floor buttons have been pressed.
            // Otherwise, it selects the first floor in an up or down queue, 
            // sends the elevator there,and removes that floor from the up queue or down queue

            upRequestsExist = (state.upRequestQueue.length > 0)
            downRequestsExist = (state.downRequestQueue.length > 0)
            describedElevator = describeElevator(elevator)
            callPrioritiesList = state[describedElevator]["callPriorities"]

            removeEmptyValuesFromQueue(state.upRequestQueue)
            removeEmptyValuesFromQueue(state.downRequestQueue)

            if (allQueuesEmpty()) {
                return
            }

            for (i = 0; i < 2; i++) {
                callPriority = callPrioritiesList[i]

                if ((callPriority == "up") && upRequestsExist) {
                    addFirstUpPassenger(elevator)
                    console.log("GetNextPassenger added floor ", elevator.destinationQueue[0], " to ", describedElevator)
                    return
                } else if ((callPriority == "down") && downRequestsExist) {
                    addFirstDownPassenger(elevator)
                    console.log("GetNextPassenger added floor ", elevator.destinationQueue[0], " to ", describedElevator)
                    return
                }
            }
        }
        
        const allQueuesEmpty = function () {
            // a shorthand definition for all state up and down queues being empty

            return ((state.upRequestQueue.length == 0) && (state.downRequestQueue.length == 0))
        }
        
        const sortDestinationQueue = function (elevator) {
            // sorts an elevator's destination queue based on whether state says it is going up or down

            describedElevator = describeElevator(elevator)
            direction = state[describedElevator]["direction"]

            if (direction == "up") {
                elevator.destinationQueue = elevator.destinationQueue.sort((a, b) => a - b)
                elevator.checkDestinationQueue()
            } else if (direction == "down") {
                elevator.destinationQueue = elevator.destinationQueue.sort((a, b) => b - a)
                elevator.checkDestinationQueue()
            } else {
                console.warn("No destination direction for sorting in function sortDestinationQueue for ", describedElevator)
            }
        }
        
        const restartElevator = function (elevator) {
            // if an elevator is stopped, give it something to do.  Either send it to 
            // a floor whose button has been pushed in the elevator or go and
            // get a passenger who is waiting for a ride.
           removeEmptyValuesFromQueue(elevator.destinationQueue)
           elevator.checkDestinationQueue()

            if (elevator.destinationQueue.length == 0) {
                elevator.destinationQueue = elevator.getPressedFloors()
                sortDestinationQueue(elevator) // includes checkDestinationQueue()
            }
            
            if (elevator.destinationQueue.length == 0) {
                getNextPassenger(elevator)
            } 
            elevator.goToFloor(elevator.destinationQueue[0])
        }
        
        const addToDestinationQueue = function (elevator, floorNum) {
            // adds a floor number to the elevator destination queue.
            // called when a floor button is pressed in the elevator.

            elevator.destinationQueue.push(floorNum)
            sortDestinationQueue(elevator) // includes checkDestinationQueue()
        }
        
        const goToDefaultFloor = function (elevator) {
            // each elevator has a default floor.  If the elevator is idle, this should
            // get called to send them to that floor.

            describedElevator = describeElevator(elevator)
            defaultFloor = state[describedElevator]["defaultFloor"]
            
            elevator.goToFloor(defaultFloor)
            console.log("sending", describedElevator, " to default floor ", defaultFloor)
        }
        
        const removeCallsFromFloorAndElevator = function (elevator, floorNum) {
            // Remove the button presses from the floors and from the elevator
            // when a not-full elevator stops at a floor and is going in that direction.
            
            describedElevator = describeElevator(elevator)
            elevatorDirection = state[describedElevator]["direction"]
            
            if (elevator.loadFactor > elevatorMostlyFullLevel) {
                // assume nobody got on the elevator
                return
            }
            
            removeFromElevatorQueue(elevator, floorNum)
            
            if (elevatorDirection == "up") {
                removeFromUpQueue(floorNum)
            } else if (elevatorDirection == "down") {
                removeFromDownQueue(floorNum)
            }
            removeEmptyValuesFromQueue(elevator.destinationQueue)
            elevator.checkDestinationQueue()
        }

        const removeEmptyValuesFromQueue = function(anyList) {
            emptyIndex = state.upRequestQueue.indexOf("")
            while (emptyIndex > -1) {
                anyList.splice(emptyIndex, 1)
                emptyIndex = anyList.indexOf("")
            }

            emptyIndex = state.upRequestQueue.indexOf(NaN)
            while (emptyIndex > -1) {
                anyList.splice(emptyIndex, 1)
                emptyIndex = anyList.indexOf(NaN)
            }

        } 
        
        floors.forEach(floor => {
            // the floors have two events - up_button_pressed and down_button_pressed.
            // sets what to do when these events happen.
            
            floor.on("up_button_pressed", function () {
                // someone on a floor has pressed the "up" button

                floorNum = floor.floorNum()
                newUpRequestQueue = [...new Set([...state.upRequestQueue, floorNum])]   //repeated pressing of button doesn't change the queue
                state.upRequestQueue = newUpRequestQueue
                console.log("up was pressed on floor ", floorNum, ".  upRequestQueue is now: ", state.upRequestQueue)
                callEmptyElevator(floorNum)
            })
            floor.on("down_button_pressed", function () {
                // someone on a floor has pressed the "down" button

                floorNum = floor.floorNum()
                newDownRequestQueue = [...new Set([...state.downRequestQueue, floorNum])]   //repeated pressing of button doesn't change the queue
                state.downRequestQueue = newDownRequestQueue
                console.log("down was pressed on floor ", floorNum, "  downRequestQueue is now: ", state.downRequestQueue)
                callEmptyElevator(floorNum)
            })
        })
        
        elevators.forEach(elevator => {
            // elevators have four events - floor_button_pressed, passing_floor, stopped_at_floor, and idle.
            // sets what to do when these events happen
            
            elevator.on("floor_button_pressed", function (floorNum) {
                // when someone presses a button inside the elevator, add it to the queue

                addToDestinationQueue(elevator, floorNum)
                console.log("button", floorNum, " pressed in elevator:", describeElevator(elevator), "while on floor ", elevator.currentFloor())
                console.log("its new destination queue is: ", elevator.destinationQueue, "and its direction is: ", elevator.destinationDirection())
            })
            
            elevator.on("passing_floor", function (floorNum, direction) {
                // the elevator is just about to pass a certain floor.  decide if we should stop there.

                updateElevatorDirectionInState(elevator, direction)
                shouldStop = stoppingDecision(elevator, floorNum)
                if (shouldStop == true) {
                    console.log(describeElevator(elevator), "decided to stop at floor ", floorNum)
                    elevator.stop()
                    elevator.goToFloor(floorNum, true)
                    restartElevator(elevator)
                }
            })
            
            elevator.on("stopped_at_floor", function (floorNum) {
                // the elevator has stoppped at a floor.  change the up/down signals if necessary, clear
                // the floor from the appropriate queues, and go to the next floor.

                setSignalsForStoppedElevator(elevator, floorNum)
                removeCallsFromFloorAndElevator(elevator, floorNum)
                console.log(describeElevator(elevator), "has stoppped at floor", floorNum, " and its signals were (up, down) ", elevator.goingUpIndicator(), elevator.goingDownIndicator())
                restartElevator(elevator)
                console.log(describeElevator(elevator), "'s destination queue is now: ", elevator.destinationQueue, "and it's on the way to floor ", elevator.destinationQueue[0])
            })
            
            elevator.on("idle", function () {
                // on the rare event that an elevator has nowhere to go, send it to its default floor

                if (elevator.currentFloor() === bottomFloor) {
                    setUpSignal(elevator)
                }
                console.log(describeElevator(elevator), " is idle")
                goToDefaultFloor(elevator)
                if (elevator.destinationQueue.length == 0) {
                    getNextPassenger(elevator)
                }
            })
        })
        // ************************
        // stopping point - a bug in the code is allowing NaN to be added to elevator's destination queues, especially if
        // they stop at a floor where there is not a person waiting.
        // ***********************
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}