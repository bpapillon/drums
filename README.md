Deployment
-------

```
aws s3 sync --acl public-read dist/ s3://bpapillon-drums/ && aws cloudfront create-invalidation --distribution-id E1B870WYNHVNA6 --paths "/"
```
