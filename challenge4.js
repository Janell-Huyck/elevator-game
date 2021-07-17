{
    init: function(elevators, floors) {

        console.log("=========================")
        console.log("   Starting new run     ")
        console.log("=========================")

        bottomFloor = 0
        console.log("Bottom floor is: ", bottomFloor)
        topFloor = floors.length - 1
        console.log("Top floor is: ", topFloor)
        elevatorMostlyFullLevel = 0.5   // elevator.loadCapacity == 1 means the elevator is completely full.  
        console.log("We have ", elevators.length, " elevators.")

        
        let state = {
            "upRequestQueue": [],
            "downRequestQueue": [],
        }

        const describeElevator = function (elevator) {
            // given an instance of an elevator, return its name
            // Useful for setting state of elevators and for console logging.

            elevatorIndex = elevators.indexOf(elevator)
            if (elevatorIndex == -1) {
                return "unknown elevator"
            } else {
                return "elevator" + (elevatorIndex + 1).toString()
            }
        }
        
        const setInitialStateValues = function (elevator) {
            describedElevator = describeElevator(elevator)
            elevatorIndex = elevators.indexOf(elevator)
            
            state[describedElevator] = {"direction": "up", "callPriorities": []}
            
            if (elevatorIndex % 2 == 0) {
                state[describedElevator]["callPriorities"] = ["up", "down"]
            } else {
                state[describedElevator]["callPriorities"] = ["down", "up"]
            }
        }
        elevators.forEach(function(elevator) {setInitialStateValues(elevator)})
        

        const callEmptyElevator = function (floorNum) {
            // Loop through all elevators and send the first empty one to the floor number given

            for (i = 0; i < elevators.length; i++) {
                elevator = elevators[i]
                removeEmptyValuesFromQueue(elevator.destinationQueue)
                elevator.checkDestinationQueue()
                if (elevator.destinationQueue.length == 0) {
                    elevator.goToFloor(floorNum)
                    setSignalForMovingElevator(elevator, floorNum)
                    return  // We only need to send 1 elevator to the floor.
                }
            }
            // console.log("no elevators were free so none were called for this button push in function callEmptyElevator")
        }

        const setSignalForMovingElevator = function (elevator) {
            // When an elevator is moving, set the direction and the signals
            // to the direction it is actually traveling.
            describedElevator = describeElevator(elevator)
            currentFloor = elevator.currentFloor()
            destinationFloor = elevator.destinationQueue[0]

            if (currentFloor < destinationFloor) {
                setUpSignal(elevator)
                updateElevatorDirectionInState(elevator, "up")
            } else if (currentFloor > destinationFloor) {
                setDownSignal(elevator)
                updateElevatorDirectionInState(elevator, "down")

            } else {
                setBothSignals(elevator)
            }
        }

        const setBothSignals = function (elevator) {
            // sets both the up and down lights on an elevator.  Does not change state direction.

            elevator.goingUpIndicator(true)
            elevator.goingDownIndicator(true)
        }

        const setDownSignal = function (elevator) {
            // Turn on the elevator's down light and turn off the elevator's up light
            // and update state

            elevator.goingUpIndicator(false)
            elevator.goingDownIndicator(true)
            updateElevatorDirectionInState(elevator, "down")

        }

        const setUpSignal = function (elevator) {
            // Turn on the elevator's up light and turn off the elevator's down light
            // and update state

            elevator.goingUpIndicator(true)
            elevator.goingDownIndicator(false)
            updateElevatorDirectionInState(elevator, "up")

        }

        const getElevatorDirectionFromState = function(elevator) {
            // Read and return the direction of an elevator from state.  Assumes 2 elevators.
            describedElevator = describeElevator(elevator)
            return state[describedElevator]["direction"]
        }

        const setSignalsForStoppedElevator = function (elevator, floorNum) {
            // Sets the up/down signals for an elevator that's stopped.
            // console.log("setting signal for stopped ", describeElevator(elevator)," on floor ", floorNum)
            currentFloor = elevator.currentFloor()
            elevatorDirection = getElevatorDirectionFromState(elevator)
            
            if (currentFloor != floorNum) {
                console.warn("Tried to set signals for stopped ", describeElevator(elevator), " but it's in between floors.")
                elevator.goToFloor(floorNum, true)
            } else if (currentFloor == topFloor) {
                setDownSignal(elevator)
            } else if (currentFloor == bottomFloor) {
                setUpSignal(elevator)
            } else if (elevatorDirection == "up") {
                setUpSignal(elevator)
            } else if (elevatorDirection == "down") {
                setDownSignal(elevator)
            } else {
                console.warn("No state elevator direction found for ", describeElevator(elevator))
            }
            // console.log("up signal:", elevator.goingUpIndicator(), "down signal: ", elevator.goingDownIndicator())
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

            elevatorDirection = getElevatorDirectionFromState(elevator)

            if (someoneWantsOff(elevator, floorNum)) {
                // console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is true because someone wants off")
                return true
            } else if (elevatorIsFull(elevator)) {
                // console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is false because elevator is full")
                return false
            } else if (someoneIsWaiting(elevatorDirection, floorNum)) {
                // console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is true because someone is waiting")
                return true
            }
            // console.log("Stopping decision at floor ", floorNum, " for ", describeElevator(elevator), " is false because we reached the end of the decision tree (nobody wants off, elevator is not full, and nobody is waiting) up queue is ", state.upRequestQueue, " and down queue is ", state.downRequestQueue, " and direction is ", elevatorDirection)
            return false
        }
        
        const removeFromElevatorQueue = function (elevator, floorNum) {
            //remove all instances of a particular floorNum from the elevator's destination queue

            floorIndex = elevator.destinationQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                elevator.destinationQueue.splice(floorIndex, 1)
                floorIndex = elevator.destinationQueue.indexOf(floorNum)
            }
            removeEmptyValuesFromQueue(elevator.destinationQueue)
            elevator.checkDestinationQueue()
        }
        
        const removeFromUpQueue = function (floorNum) {
            // remove all instances of a particular floorNum from the state's tracking of the floor up-requests

            floorIndex = state.upRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.upRequestQueue.splice(floorIndex, 1)
                floorIndex = state.upRequestQueue.indexOf(floorNum)
            }
            removeEmptyValuesFromQueue(state.upRequestQueue)
        }
        
        const removeFromDownQueue = function (floorNum) {
            // remove all instances of a particular floorNum from the state's tracking of the floor down-requests

            floorIndex = state.downRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.downRequestQueue.splice(floorIndex, 1)
                floorIndex = state.downRequestQueue.indexOf(floorNum)
            }
            removeEmptyValuesFromQueue(state.downRequestQueue)
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
            elevator.checkDestinationQueue()
            // removeFromUpQueue(floorNum)
        }

        const addFirstDownPassenger = function (elevator) {
            // sends the elevator to the first floor in the down request queue stored in state
            // and then removes that floor from the down queue

            floorNum = state.downRequestQueue[0]
            elevator.goToFloor(floorNum)
            elevator.checkDestinationQueue()
            // removeFromDownQueue(floorNum)
        }
        
        const removeAllEmptyValuesFromAllRequestQueues = function () {
            // remove all empty values from request queues in state

            removeEmptyValuesFromQueue(state.upRequestQueue)
            removeEmptyValuesFromQueue(state.downRequestQueue)
        }

        const removeAllEmptyValuesFromAllElevators = function () {
            // remove all empty values from all elevator destination queues

            elevators.forEach(function (elevator) {removeEmptyValuesFromQueue(elevator.destinationQueue)})
            elevators.forEach(function (elevator) {elevator.checkDestinationQueue()})
        }

        const getNextPassenger = function (elevator) {
            // Does nothing if no floor buttons have been pressed.
            // Otherwise, it selects the first floor in an up or down queue, 
            // sends the elevator there,and removes that floor from the up queue or down queue
            
            removeAllEmptyValuesFromAllElevators()
            removeAllEmptyValuesFromAllRequestQueues()

            upRequestsExist = (state.upRequestQueue.length > 0)
            downRequestsExist = (state.downRequestQueue.length > 0)
            describedElevator = describeElevator(elevator)
            callPrioritiesList = state[describedElevator]["callPriorities"]


            if (allQueuesEmpty()) {
                return
            }

            for (i = 0; i < 2; i++) {
                callPriority = callPrioritiesList[i]

                if ((callPriority == "up") && upRequestsExist) {
                    addFirstUpPassenger(elevator)
                    setSignalForMovingElevator(elevator)
                    // console.log("GetNextPassenger added floor ", elevator.destinationQueue[0], " to ", describedElevator)
                    return
                } else if ((callPriority == "down") && downRequestsExist) {
                    addFirstDownPassenger(elevator)
                    setSignalForMovingElevator(elevator)
                    // console.log("GetNextPassenger added floor ", elevator.destinationQueue[0], " to ", describedElevator)
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
            direction = getElevatorDirectionFromState(elevator)

            if (direction == "up") {
                elevator.destinationQueue = elevator.destinationQueue.sort((a, b) => a - b)
                elevator.checkDestinationQueue()
                setSignalForMovingElevator(elevator)
            } else if (direction == "down") {
                elevator.destinationQueue = elevator.destinationQueue.sort((a, b) => b - a)
                elevator.checkDestinationQueue()
                setSignalForMovingElevator(elevator)

            } else {
                console.warn("No destination direction for sorting in function sortDestinationQueue for ", describedElevator)
                elevator.checkDestinationQueue()
            }
        }
        
        const restartElevator = function (elevator) {
            // if an elevator is stopped, give it something to do.  Either send it to 
            // a floor whose button has been pushed in the elevator or go and
            // get a passenger who is waiting for a ride.
            removeEmptyValuesFromQueue(elevator.destinationQueue)
            elevator.checkDestinationQueue()

            // console.log("in restart elevator function, ", describeElevator(elevator),"'s destination queue is: ", elevator.destinationQueue, "before adding anything but after removing empties")

            if (elevator.destinationQueue.length == 0) {
                elevator.destinationQueue = elevator.getPressedFloors()
                sortDestinationQueue(elevator) // includes checkDestinationQueue()
                // console.log("in restart elevator function, ", describeElevator(elevator),"'s destination queue is: ", elevator.destinationQueue, "after getting pressed floors and sorting")
            }
            
            if (elevator.destinationQueue.length == 0) {
                getNextPassenger(elevator)
                elevator.checkDestinationQueue()
            }
           
            // console.log("in restart elevator function, ", describeElevator(elevator),"'s destination queue is: ", elevator.destinationQueue, "after calling getNextPassenger")
            if (elevator.destinationQueue.length > 0) {
                elevator.goToFloor(elevator.destinationQueue[0])
            } else {
                elevator.goToFloor(0)
            }
            // console.log("in restart elevator function, ", describeElevator(elevator),"'s destination queue is: ", elevator.destinationQueue, "at the end of the function")

        }
        
        const addToDestinationQueue = function (elevator, floorNum) {
            // adds a floor number to the elevator destination queue.
            // called when a floor button is pressed in the elevator.

            elevator.destinationQueue.push(floorNum)
            sortDestinationQueue(elevator) // includes checkDestinationQueue()
        }
               
        const removeCallsFromFloorAndElevator = function (elevator, floorNum) {
            // Remove the button presses from the floors and from the elevator
            // when a not-full elevator stops at a floor and is going in that direction.
            
            // console.log("removeCallsFromFloorandElevator start - elevator: ", elevator.destinationQueue, " upQueue: ", state.upRequestQueue, ", downQueue: ", state.downRequestQueue, ", floorNum to remove: ", floorNum)
            describedElevator = describeElevator(elevator)
            elevatorDirection = getElevatorDirectionFromState(elevator)
            
            if (elevator.loadFactor > elevatorMostlyFullLevel) {
                // console.log("aborting removeCallsFromFloorAndElevator because of elevator load factor: ", elevator.loadFactor, " is greater than cutoff: ", elevatorMostlyFullLevel)
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
            // console.log("removeCallsFromFloorandElevator finish - elevator: ", elevator.destinationQueue, " upQueue: ", state.upRequestQueue, ", downQueue: ", state.downRequestQueue, ", floorNum to remove: ", floorNum)

        }

        const removeEmptyValuesFromQueue = function(anyList) {
            // Given a list, returns that list with all items that aren't digits removed.
            if (anyList.length == 0) {
                return
            }
            // console.log("removeEmptyValuesFromQueue start: ", anyList)

            anyList = anyList.filter(n => [0,1,2,3,4,5,6,7,8,9].includes(n))
            // console.log("removeEmptyValuesFromQueue finish: ", anyList)

            return anyList

        } 
        
        floors.forEach(floor => {
            // the floors have two events - up_button_pressed and down_button_pressed.
            // sets what to do when these events happen.
            
            floor.on("up_button_pressed", function () {
                // someone on a floor has pressed the "up" button

                floorNum = floor.floorNum()
                newUpRequestQueue = [...new Set([...state.upRequestQueue, floorNum])]   //repeated pressing of button doesn't change the queue
                state.upRequestQueue = newUpRequestQueue
                // console.log("up was pressed on floor ", floorNum, ".  upRequestQueue is now: ", state.upRequestQueue)
                callEmptyElevator(floorNum)
            })
            floor.on("down_button_pressed", function () {
                // someone on a floor has pressed the "down" button

                floorNum = floor.floorNum()
                newDownRequestQueue = [...new Set([...state.downRequestQueue, floorNum])]   //repeated pressing of button doesn't change the queue
                state.downRequestQueue = newDownRequestQueue
                // console.log("down was pressed on floor ", floorNum, "  downRequestQueue is now: ", state.downRequestQueue)
                callEmptyElevator(floorNum)
            })
        })
        
        

        
        elevators.forEach(elevator => {
            // elevators have four events - floor_button_pressed, passing_floor, stopped_at_floor, and idle.
            // sets what to do when these events happen

            
            elevator.on("floor_button_pressed", function (floorNum) {
                // when someone presses a button inside the elevator, add it to the queue

                addToDestinationQueue(elevator, floorNum)
                // console.log("button", floorNum, " pressed in elevator:", describeElevator(elevator), "while on floor ", elevator.currentFloor())
                // console.log("its new destination queue is: ", elevator.destinationQueue, "and its direction is: ", elevator.destinationDirection())
            })
            
            elevator.on("passing_floor", function (floorNum, direction) {
                // the elevator is just about to pass a certain floor.  decide if we should stop there.

                updateElevatorDirectionInState(elevator, direction)
                shouldStop = stoppingDecision(elevator, floorNum)
                if (shouldStop == true) {
                    // console.log(describeElevator(elevator), "decided to stop at floor ", floorNum)
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
                // console.log(describeElevator(elevator), "has stoppped at floor", floorNum, " and its signals were up: ", elevator.goingUpIndicator(), ", down: ", elevator.goingDownIndicator())

                restartElevator(elevator)
                // console.log(describeElevator(elevator), "'s destination queue is now: ", elevator.destinationQueue, "and it's on the way to floor ", elevator.destinationQueue[0])
            })
            
            elevator.on("idle", function () {
                // on the rare event that an elevator has nowhere to go, do nothing

                if (elevator.currentFloor() === bottomFloor) {
                    setUpSignal(elevator)
                }
                // console.log(describeElevator(elevator), " is idle")
                if (elevator.destinationQueue.length == 0) {
                    getNextPassenger(elevator)
                }
            })
        })



    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}