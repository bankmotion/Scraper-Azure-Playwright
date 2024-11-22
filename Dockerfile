# Ensure Chromium is installed when the container starts
COPY install-chrome.sh /usr/local/bin/install-chrome.sh
RUN chmod +x /usr/local/bin/install-chrome.sh
RUN /usr/local/bin/install-chrome.sh
