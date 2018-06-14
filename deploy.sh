yarn build
cd dist
echo deft.design >> CNAME
rm -rf .git
git init
git remote add origin git@github.com:ericaprieto/deft.design.git
git add -A
git commit -m deploy
git branch gh-pages
git checkout gh-pages
git branch master -D
git push origin gh-pages --force
rm -rf .git
