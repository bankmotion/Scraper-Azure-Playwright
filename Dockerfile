# Ensure Chromium is installed when the container starts
COPY install-chrome.sh /home/install-chrome.sh
RUN chmod +x /home/install-chrome.sh
RUN /home/install-chrome.sh
