const fs = require("fs");
const path = require("path");
const yaml = require("yaml-front-matter");

function findVideoFilesRecursive(dir, arrayOfFiles) {
  const files = fs.readdirSync(dir);

  arrayOfFiles = arrayOfFiles || [];

  for (const file of files) {
    if (fs.statSync(`${dir}/${file}`).isDirectory()) {
      arrayOfFiles = findVideoFilesRecursive(`${dir}/${file}`, arrayOfFiles);
    } else {
      if (file !== 'index.md' && file.substring(file.length - 3, file.length) === '.md') {
        arrayOfFiles.push(path.join(dir, '/', file));
      }
    }
  }

  return arrayOfFiles;
}

function getPlaylist(file) {
  const series = file.substring(0, file.lastIndexOf('/')) + '/index.md';
  const content = fs.readFileSync(series);
  const parsed = yaml.loadFront(content);
  if (parsed.playlist_id) {
    return parsed.playlist_id;
  }
  return false;
}

function getVideoData() {
  const directories = [
    '_Noticias'
  ];

  let files = [];
  for (const dir of directories) {
    findVideoFilesRecursive(dir, files);
  }

  const videos = [];

  for (const file of files) {
    const content = fs.readFileSync(`./${file}`, 'UTF8');
    const parsed = yaml.loadFront(content);
    let url = file.substring(1);
    url = url.substring(0, url.length - 3);
    videos.push({
      pageURL: url,
      data: parsed,
      playlist: getPlaylist(file),
    });
  }

  return videos;
}

function primeDirectory(dir) {

  fs.rmdirSync(dir, {
    recursive: true
  }, (err) => {
    if (err) {
      throw err;
    }
  });

  fs.mkdirSync(dir, err => {
    if (err) {
      throw err;
    }
  });

}

function getVideoID(url) {
  const location = url.substring(1, url.length);
  let page;
  try {
    page = fs.readFileSync(`./_${location}.md`, "UTF8");
  } catch (err) {
    try {
      const files = fs.readdirSync(`./_${location}`);
      page = fs.readFileSync(`./_${location}/${files[0]}.md`, "UTF8");
    } catch (e) {
      return url;
    }
  }
  const parsed_content = yaml.loadFront(page);
  return `https://youtu.be/${parsed_content.video_id}`;
}

function writeDescriptions(videos) {
  primeDirectory("./descripciones");

  for (let i = 0; i < videos.length; i++) {
    const data = videos[i].data;
    const pageURL = videos[i].pageURL;
    const playlist = videos[i].playlist;

    let description = "";

    // Description
    let content = data.__content;
    description += `${content.trim()}\n`;

    // Code
    if (data.repository || data.web_editor) {
      description += `\n💻 Codigo: https://nocheprogramacion.com/${pageURL}.html\n`;
    } else {
      description += `\n🖥 Articulo: https://nocheprogramacion.com/${pageURL}.html\n`;
    }

    // Next Video / Playlist
    let nextID;
    if (i !== videos.length - 1) {
      if (pageURL.substring(0, pageURL.lastIndexOf('/')) === videos[i + 1].pageURL.substring(0, videos[i + 1].pageURL.lastIndexOf('/'))) {
        nextID = videos[i + 1].data.video_id;
      } else {
        nextID = false;
      }
    } else {
      nextID = false;
    }

    if (playlist || nextID) {
      description += `\n`;
      if (nextID) {
        description += `🎥 Siquiente video: https://youtu.be/${nextID}\n`;
      }
      if (playlist) {
        description += `🎥 Playlist: https://www.youtube.com/playlist?list=${playlist}\n`;
      }
    }

    // Timestamps
    if (data.topics) {
      description += "\nIndice:\n";
      for (let i = 0; i < data.topics.length; ++i) {
        description += `${data.topics[i].time} ${data.topics[i].title}\n`;
      }
    }

    // Links
    if (data.links) {
      description += "\nLink referencie del video:\n";
      for (let i = 0; i < data.links.length; ++i) {
        const url = data.links[i].url;
        if (/https?:\/\/.*/.test(url)) {
          description += `🔗 ${data.links[i].title}: ${url}\n`;
        } else {
          description += `🔗 ${data.links[i].title}: https://nocheprogramacion.com/${url}\n`;
        }
      }
    }

    // News
    if (data.news) {
      description += "\nNoticias:\n";
      for (let i = 0; i < data.news.length; ++i) {
        if (data.news[i].url) {
          const url = data.news[i].url;
          if (/https?:\/\/.*/.test(url)) {
            description += `📨 ${data.news[i].title}: ${url}\n`;
          } else {
            description += `📨 ${data.news[i].title}: https://nocheprogramacion.com/${url}\n`;
          }
        } else {
            description += `📨 ${data.news[i].title}\n`;
        }
      }
    }

    // News
    if (data.presenter) {
      description += "\nNoticias:\n";
      for (let i = 0; i < data.presenter.length; ++i) {
        const url = data.presenter[i].url;
        if (/https?:\/\/.*/.test(url)) {
          description += `👤 ${data.presenter[i].title}: ${url}\n`;
        } else {
          description += `👤 ${data.presenter[i].title}: https://nocheprogramacion.com/${url}\n`;
        }
      }
    }


    // Links
    if (data.piezas) {
      description += "\nComponentes electronicos mencionado video:\n";
      for (let i = 0; i < data.piezas.length; ++i) {
        const url = data.piezas[i].url;
        if (url) {
          if (/https?:\/\/.*/.test(url)) {
            description += `🤖 ${data.piezas[i].title}: ${url}\n`;
          } else {
            description += `🤖 ${data.piezas[i].title}: https://nocheprogramacion.com${url}\n`;
          }
        } else {
          description += `🤖 ${data.piezas[i].title}\n`;
        }
      }
    }

    // Videos
    if (data.videos) {
      description += "\nOtros video mencionados en video:\n";
      for (let i = 0; i < data.videos.length; ++i) {
        if (data.videos[i].video_id) {
          description += `🎥 ${data.videos[i].title}: https://youtu.be/${data.videos[i].video_id}\n`;
        } else if (data.videos[i].url) {
          const url = data.videos[i].url;
          if (/https?:\/\/.*/.test(url)) {
            description += `🎥 ${data.videos[i].title}: ${url}\n`;
          } else {
            description += `🎥 ${data.videos[i].title}: https://nocheprogramacion.com${url}\n`;
          }
        }
      }
    }

    // General Links
    description += `
🚂 Sitio Web: http://nocheprogramacion.com
👾 Comparte tu creación! https://nocheprogramacion.com/tucodigo
🚩 Sugerir Temas: https://github.com/alswnet/NocheProgramacion/issues/new
💡 GitHub: https://github.com/alswnet
💬 Discord: https://nocheprogramacion.com/discord
💖 Apoyo: https://nocheprogramacion.com/apoyo
💰 Donacion: https://nocheprogramacion.com/donar
🌎 Noticias: https://programacion.news
🖋️ Twitter: https://twitter.com/alswnet
📸 Instagram: https://www.instagram.com/alswnet
🕹 Canal VideoJuegos: https://www.youtube.com/channel/UC-QPTA-oIQf59SVA8ckpMXA?sub_confirmation=1\n`;

    if (data.tags) {
      description += `\n#ALSW`;
      for (let i = 0; i < data.tags.length; ++i) {
        description += ` #` + data.tags[i];
      }
      description += `\n`;
    }

    description += `\nEsta descripción fue auto-generada. Si ves algún problema, por favor reportarlo en https://github.com/alswnet/ProgramacionNews/issues/new`;

    let NombreArchivo = `${data.video_id}`;
    if (data.video_number) {
      NombreArchivo = `${data.video_number}_${NombreArchivo}`;
    }
    if (data.course_number) {
      NombreArchivo = `${data.course_number}.${NombreArchivo}`;
    }

    let tipo = videos[i].pageURL.split("/")[0];
    NombreArchivo = `${tipo}_${NombreArchivo}`;

    fs.writeFileSync(`descripciones/${NombreArchivo}.txt`, description);
    fs.writeFileSync(`descripciones/Zen_${data.video_id}.txt`, description);
  }
}

(() => {
  console.log("💫 Generador de Description de Youtube 💫");
  writeDescriptions(getVideoData());
})();
