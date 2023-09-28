# building_histories


# Testing the website locally
To test the website locally you'll need to run a web server.
Using python makes this easy, and having a virtual environment set-up for this allows you to install the needed package for this specific project.

To setup a virtual environment with a websever you can run the following from the terminal on osx and linux.
Note: The requirements.txt file contains all the required packages, which in this case is only the "simple-http-server" package.

```
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
# and to run the update script use
python add_html_path.py
```


To run a local server from the terminal on osx and linux use:
```
python -m http.server 8000
```
Then navigate to http://localhost:8000/ from your web browser