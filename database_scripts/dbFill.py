#!/usr/bin/env python

"""
 * @file dbFill.py
 * Used in CS498RK MP4 to populate database with randomly generated users and tasks.
 *
 * @author Aswin Sivaraman
 * @date Created: Spring 2015
 * @date Modified: Spring 2015
 * @date Modified: Spring 2019
"""

import sys
import getopt
import http.client
import urllib
import json
from random import randint
from random import choice
from datetime import date
from time import mktime

def usage():
    print('dbFill.py -u <baseurl> -p <port> -n <numUsers> -t <numTasks>')

def getUsers(conn):
    # Retrieve the list of users
    conn.request("GET","""/api/users?filter={"_id":1}""")
    response = conn.getresponse()
    data = response.read()
    d = json.loads(data)

    # Array of user IDs
    users = [str(d['data'][x]['_id']) for x in range(len(d['data']))]

    return users

def main(argv):

    # Server Base URL and port
    baseurl = "localhost"
    port = 4000

    # Number of POSTs that will be made to the server
    userCount = 50
    taskCount = 200

    try:
        opts, args = getopt.getopt(argv,"hu:p:n:t:",["url=","port=","users=","tasks="])
    except getopt.GetoptError:
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
             usage()
             sys.exit()
        elif opt in ("-u", "--url"):
             baseurl = str(arg)
        elif opt in ("-p", "--port"):
             port = int(arg)
        elif opt in ("-n", "--users"):
             userCount = int(arg)
        elif opt in ("-t", "--tasks"):
             taskCount = int(arg)

    # Python array containing common first names and last names
    firstNames = ["james","john","robert","michael","william","david","richard","charles","joseph","thomas","christopher","daniel","paul","mark","donald","george","kenneth","steven","edward","brian","ronald","anthony","kevin","jason","matthew","gary","timothy","jose","larry","jeffrey","frank","scott","eric","stephen","andrew","raymond","gregory","joshua","jerry","dennis","walter","patrick","peter","harold","douglas","henry","carl","arthur","ryan","roger","joe","juan","jack","albert","jonathan","justin","terry","gerald","keith","samuel","willie","ralph","lawrence","nicholas","roy","benjamin","bruce","brandon","adam","harry","fred","wayne","billy","steve","louis","jeremy","aaron","randy","howard","eugene","carlos","russell","bobby","victor","martin","ernest","phillip","todd","jesse","craig","alan","shawn","clarence","sean","philip","chris","johnny","earl","jimmy","antonio","danny","bryan","tony","luis","mike","stanley","leonard","nathan","dale","manuel","rodney","curtis","norman","allen","marvin","vincent","glenn","jeffery","travis","jeff","chad","jacob","lee","melvin","alfred","kyle","francis","bradley","jesus","herbert","frederick","ray","joel","edwin","don","eddie","ricky","troy","randall","barry","alexander","bernard","mario","leroy","francisco","marcus","micheal","theodore","clifford","miguel","oscar","jay","jim","tom","calvin","alex","jon","ronnie","bill","lloyd","tommy","leon","derek","warren","darrell","jerome","floyd","leo","alvin","tim","wesley","gordon","dean","greg","jorge","dustin","pedro","derrick","dan","lewis","zachary","corey","herman","maurice","vernon","roberto","clyde","glen","hector","shane","ricardo","sam","rick","lester","brent","ramon","charlie","tyler","gilbert","gene"]
    lastNames = ["smith","johnson","williams","jones","brown","davis","miller","wilson","moore","taylor","anderson","thomas","jackson","white","harris","martin","thompson","garcia","martinez","robinson","clark","rodriguez","lewis","lee","walker","hall","allen","young","hernandez","king","wright","lopez","hill","scott","green","adams","baker","gonzalez","nelson","carter","mitchell","perez","roberts","turner","phillips","campbell","parker","evans","edwards","collins","stewart","sanchez","morris","rogers","reed","cook","morgan","bell","murphy","bailey","rivera","cooper","richardson","cox","howard","ward","torres","peterson","gray","ramirez","james","watson","brooks","kelly","sanders","price","bennett","wood","barnes","ross","henderson","coleman","jenkins","perry","powell","long","patterson","hughes","flores","washington","butler","simmons","foster","gonzales","bryant","alexander","russell","griffin","diaz","hayes"]

    # Server to connect to (1: url, 2: port number)
    conn = http.client.HTTPConnection(baseurl, port)

    # HTTP Headers
    headers = {"Content-type": "application/x-www-form-urlencoded","Accept": "text/plain"}

    # Array of user IDs
    userIDs = []
    userNames = []
    userEmails = []

    # Loop 'userCount' number of times
    for i in range(userCount):

        # Pick a random first name and last name
        x = randint(0,99)
        y = randint(0,99)
        params = urllib.parse.urlencode({'name': firstNames[x] + " " + lastNames[y], 'email': firstNames[x] + "@" + lastNames[y] + ".com"})

        # POST the user
        conn.request("POST", "/api/users", params, headers)
        response = conn.getresponse()
        data = response.read()
        d = json.loads(data)

        # Store the users id
        userIDs.append(str(d['data']['_id']))
        userNames.append(str(d['data']['name']))
        userEmails.append(str(d['data']['email']))

    # Open 'tasks.txt' for sample task names
    f = open('tasks.txt','r')
    taskNames = f.read().splitlines()

    # Loop 'taskCount' number of times
    for i in range(taskCount):

        # Randomly generate task parameters
        assigned = (randint(0,10) > 4)
        assignedUser = randint(0,len(userIDs)-1) if assigned else -1
        assignedUserID = userIDs[assignedUser] if assigned else ''
        assignedUserName = userNames[assignedUser] if assigned else 'unassigned'
        assignedUserEmail = userEmails[assignedUser] if assigned else 'unassigned'
        completed = (randint(0,10) > 5)
        deadline = (mktime(date.today().timetuple()) + randint(86400,864000)) * 1000
        description = "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English."
        params = urllib.parse.urlencode({'name': choice(taskNames), 'deadline': deadline, 'assignedUserName': assignedUserName, 'assignedUser': assignedUserID, 'completed': str(completed).lower(), 'description': description})

        # POST the task
        conn.request("POST", "/api/tasks", params, headers)
        response = conn.getresponse()
        data = response.read()
        d = json.loads(data)

        taskID = str(d['data']['_id'])

        # Make sure the task is added to the pending list of the user
        if assigned and not completed:
            # GET the correct user
            conn.request("GET","""/api/users?where={"_id":\""""+assignedUserID+"""\"}""")
            response = conn.getresponse()
            data = response.read()
            d = json.loads(data)

            # Store all the user properties
            assignedUserName = str(d['data'][0]['name'])
            assignedUserEmail = str(d['data'][0]['email'])
            assignedUserDate = str(d['data'][0]['dateCreated'])

            # Append the new taskID to pending tasks
            assignedUserTasks = d['data'][0]['pendingTasks']
            assignedUserTasks = [str(x).replace('[','').replace(']','').replace("'",'').replace('"','') for x in assignedUserTasks]
            assignedUserTasks.append(taskID)

            # PUT in the user
            params = urllib.parse.urlencode({'_id': assignedUserID, 'name': assignedUserName, 'email': assignedUserEmail, 'dateCreated': assignedUserDate, 'pendingTasks': assignedUserTasks}, True)
            conn.request("PUT", "/api/users/"+assignedUserID, params, headers)
            response = conn.getresponse()
            data = response.read()
            d = json.loads(data)

    # Exit gracefully
    conn.close()
    print(str(userCount)+" users and "+str(taskCount)+" tasks added at "+baseurl+":"+str(port))


if __name__ == "__main__":
     main(sys.argv[1:])
