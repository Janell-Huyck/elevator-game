{
    init: function(elevators, floors) {
        console.log("=========================")
        console.log("   Starting new run     ")
        console.log("=========================")

        elevator1 = elevators[0]
        elevator1.preferredDirection = "up"
        elevator1.defaultFloor = 1
        elevator2 = elevators[1]
        elevator2.preferredDirection = "down"
        elevator2.defaultFloor = 4
        bottomFloor = 0
        console.log("Bottom floor is: ", bottomFloor)
        topFloor = floors.length - 1
        console.log("Top floor is: ", topFloor)
        elevatorMostlyFullLevel = 0.7   // elevator.loadCapacity == 1 means the elevator is completely full.  

        let state = {
            "upRequestQueue": [],
            "downRequestQueue": [],
            "elevator1Direction": "up",
            "elevator2Direction": "up" 
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

            if (elevator == elevator1) {
                return state.elevator1Direction
            }
            return state.elevator2Direction
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
            // This function is just used to make console logging messages more readable.

            if (elevator == elevator1) {
                return "elevator 1"
            }
            return "elevator 2"
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

        //********************************
        // Stopping Point - I'm cleaning up code, adding comments, and looking
        // for bugs, working my way down from top to bottom
        //******************************
        
        const removeFromElevatorQueue = function (elevator, floorNum) {
            floorIndex = elevator.destinationQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                elevator.destinationQueue.splice(floorIndex, 1)
                floorIndex = elevator.destinationQueue.indexOf(floorNum)
            }
            elevator.checkDestinationQueue()
        }
        
        const removeFromUpQueue = function (floorNum) {
            floorIndex = state.upRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.upRequestQueue.splice(floorIndex, 1)
                floorIndex = state.upRequestQueue.indexOf(floorNum)
            }
        }
        
        const removeFromDownQueue = function (floorNum) {
            floorIndex = state.downRequestQueue.indexOf(floorNum)
            while (floorIndex > -1) {
                state.downRequestQueue.splice(floorIndex, 1)
                floorIndex = state.downRequestQueue.indexOf(floorNum)
            }
        }
        
        const elevatorAlmostThere = function (elevator, direction) {
            console.log("The destination queue for ", describeElevator(elevator), " at the start of 'elevatorAlmostThere' is ", elevator.destinationQueue)
            
            destinationFloorNum = elevator.destinationQueue[0]
            currentFloor = elevator.currentFloor()
            if (Math.abs(destinationFloorNum - currentFloor) == 1) {
                if (direction == "up") {
                    removeFromUpQueue(destinationFloorNum)
                }
                
                if (direction == "down") {
                    removeFromDownQueue(destinationFloorNum)
                }
                console.log("The destination queue for ", describeElevator(elevator), " near the end of 'elevatorAlmostThere' is ", elevator.destinationQueue)
                return true
            }
            return false
        }
        
        const setSignalsForMovingElevator = function (elevator, direction) {
            if (direction == "up") {
                setUpSignal(elevator)
            } else if (direction == "down") {
                setDownSignal(elevator)
            } else {
                console.warn("attempted to change elevator signal but it was stopped")
            }
        }
        
        const getNextPassenger = function (elevator) {
            if (allQueuesEmpty()) {
                return
            }
            while (elevator.destinationQueue.length == 0) {
                firstUpFloor = state.upRequestQueue[0]
                firstDownFloor = state.downRequestQueue[0]
                if (elevator == elevator1) {
                    if (state.upRequestQueue.length > 0) {
                        addToDestinationQueue(elevator, firstUpFloor)
                        elevator.goToFloor(firstUpFloor)
                        removeFromUpQueue(firstUpFloor)
                        console.log("GetNextPassenger added floor ", firstUpFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                    } else {
                        addToDestinationQueue(elevator, firstDownFloor)
                        
                        elevator.goToFloor(firstDownFloor)
                        removeFromDownQueue(firstDownFloor)
                        console.log("GetNextPassenger added floor ", firstDownFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                    }
                    elevator.checkDestinationQueue()
                } else {
                    if (state.downRequestQueue.length > 0) {
                        addToDestinationQueue(elevator, firstDownFloor)
                        
                        elevator.goToFloor(firstDownFloor)
                        removeFromDownQueue(firstDownFloor)
                        console.log("GetNextPassenger added floor ", firstDownFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                        
                    } else {
                        addToDestinationQueue(elevator, firstUpFloor)
                        
                        elevator.goToFloor(firstUpFloor)
                        removeFromUpQueue(firstUpFloor)
                        console.log("GetNextPassenger added floor ", firstUpFloor, " to ", describeElevator(elevator), ".  Queue is now ", elevator.destinationQueue)
                    }
                }
            }
        }
        
        const allQueuesEmpty = function () {
            return ((state.upRequestQueue.length == 0) && (state.downRequestQueue.length == 0))
        }
        
        const sortDestinationQueue = function (elevator, direction = "stopped") {
            if (direction == "up") {
                let sortedQueue = elevator.destinationQueue.sort((a, b) => a - b)
                return sortedQueue
            } else if (direction == "down") {
                let sortedQueue = elevator.destinationQueue.sort((a, b) => b - a)
                return sortedQueue
            }
            console.warn("No destination direction for sorting.  Returning default queue")
            return elevator.destinationQueue
        }
        
        const restart = function (elevator) {
            console.log(describeElevator(elevator), "'s destination queue is ", elevator.destinationQueue, "at the start of the restart function")
            
            elevator.destinationQueue = elevator.getPressedFloors()
            if (elevator.destinationQueue.length == 0) {
                getNextPassenger(elevator)
            } 
            elevator.destinationQueue = sortDestinationQueue(elevator)
            elevator.checkDestinationQueue()
            console.log(describeElevator(elevator), "'s destination queue is ", elevator.destinationQueue, "near the end of the restart function")
            elevator.goToFloor(elevator.destinationQueue[0])
        }
        
        const addToDestinationQueue = function (elevator, floorNum) {
            elevator.destinationQueue.push(floorNum)
            elevator.destinationQueue = sortDestinationQueue(elevator)
            elevator.checkDestinationQueue()
        }
        
        const goToDefaultFloor = function (elevator) {
            if (elevator == elevator1) {
                console.log("sending", describeElevator(elevator), " to default floor ", elevator1.defaultFloor)
                elevator.goToFloor(elevator1.defaultFloor)
            }
            if (elevator == elevator2) {
                console.log("sending", describeElevator(elevator), " to default floor ", elevator2.defaultFloor)
                elevator.goToFloor(elevator2.defaultFloor)
            }
        }
        
        const removeCallSignalsForFloorAndDirection = function (elevator, floorNum) {
            // Remove the button presses from the floors when a not-full elevator stops and is
            // going in that direction.
            if (elevator.loadFactor > elevatorMostlyFullLevel) {
                return
            }
            // Determine direction by use of direction signals on elevator
            
        }
        
        floors.forEach(floor => {
            
            floor.on("up_button_pressed", function () {
                floorNum = floor.floorNum()
                newUpRequestQueue = [...new Set([...state.upRequestQueue, floorNum])]
                state.upRequestQueue = newUpRequestQueue
                console.log("up was pressed on floor ", floorNum, ".  upRequestQueue is now: ", state.upRequestQueue)
                callEmptyElevator(floorNum)
            })
            floor.on("down_button_pressed", function () {
                floorNum = floor.floorNum()
                newDownRequestQueue = [...new Set([...state.downRequestQueue, floorNum])]
                state.downRequestQueue = newDownRequestQueue
                console.log("down was pressed on floor ", floorNum, "  downRequestQueue is now: ", state.downRequestQueue)
                callEmptyElevator(floorNum)
            })
        })
        
        elevators.forEach(elevator => {
            
            elevator.on("floor_button_pressed", function (floorNum) {
                addToDestinationQueue(elevator, floorNum)
                console.log("button", floorNum, " pressed in elevator:", describeElevator(elevator), "while on floor ", elevator.currentFloor())
                console.log("its new destination queue is: ", elevator.destinationQueue, "and its direction is: ", elevator.destinationDirection())
            })
            
            elevator.on("passing_floor", function (floorNum, direction) {
                setSignalsForMovingElevator(elevator, direction)
                elevatorAlmostThere(elevator, direction)
                shouldStop = stoppingDecision(elevator, floorNum)
                if (shouldStop == true) {
                    console.log(describeElevator(elevator), "decided to stop at floor ", floorNum)
                    elevator.stop()
                    elevator.goToFloor(floorNum, true)
                    restart(elevator)
                }
            })
            
            elevator.on("stopped_at_floor", function (floorNum) {
                removeFromElevatorQueue(elevator, currentFloor)
                setSignalsForStoppedElevator(elevator, floorNum)
                removeCallSignalsForFloorAndDirection(elevator, floorNum)
                console.log(describeElevator(elevator), "has stoppped at floor", floorNum, " and its signals were (up, down) ", elevator.goingUpIndicator(), elevator.goingDownIndicator())
                restart(elevator)
                console.log(describeElevator(elevator), "'s destination queue is now: ", elevator.destinationQueue, "and it's on the way to floor ", elevator.destinationQueue[0])
            })
            
            elevator.on("idle", function () {
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
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
// elevator.destinationQueue.sort((a, b) => a - b)