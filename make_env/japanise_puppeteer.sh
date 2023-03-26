sudo apt install libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev

apt-get update
apt-get -y install locales fonts-ipafont fonts-ipaexfont
sudo chmod a+w /etc/locale.gen
sudo echo "ja_JP UTF-8" > /etc/locale.gen && locale-gen
