npm cache clear --force
npm install
for patch in patches/*.patch; do
  patch -p1 < "$patch"
done
cd ios
pod cache clean --all && pod deintegrate && pod install --repo-update
cd ../
# delete .husky/pre-commit !!!
# To run android:
# npm run android-apk-release
