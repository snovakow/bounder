// This project's settings for the /deploy skill, which builds main's committed files in a temp folder and
// copies the build into the live folder. The site is a plain static build, so the only setting is the
// live folder's name under the machine's deploy.liveRoot; the path itself stays in git config.
export default {
  liveName: 'bounder',
};
