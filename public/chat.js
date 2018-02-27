var user,
  rooms = [],
  selected_room = null;

var tokenProvider = new Chatkit.TokenProvider({
  url: '/token'
});

var chatManager = new Chatkit.ChatManager({
  instanceLocator: 'v1:us1:7cb50989-8e34-4a3b-961a-79695acc72c1',
  userId: $('#user_id').val(),
  tokenProvider: tokenProvider
});

/**
 * Activate connection to chatKit
 */
chatManager.connect({
  onSuccess(currentUser) {
    user = currentUser;
    // Load chat rooms user belongs to
    loadUserChatRooms();
  },
  onError(error) {
    console.log('Error on connection');
  }
});

function loadUserChatRooms() {
  // put rooms created by the user into the rooms global variable
  rooms = user.rooms;
  // getAllRooms that the user is a member of and can join.
  user.getAllRooms(
    rms => {
      // Push into existing rooms while avoiding duplicates
      rms.forEach(rm => {
        if (!rooms.find(room => room.id == rm.id)) {
          rooms.push(rm);
        }
      });
      // Clear existing data
      $('#rooms-list').html('');
      rooms.forEach(room => {
        // Subscribe to rooms that the user is a member of
        subscribeUserToRoom(room);
        // Add Room to list sidebar
        addRoomToList(room);
      });
    },
    error => {
      console.log(`Error getting rooms: ${error}`);
    }
  );
}

function subscribeUserToRoom(room) {
  if (room.userIds.find(user_id => user_id == user.id)) {
    room.user_is_a_member = true;
    user.subscribeToRoom(
      room,
      {
        newMessage: handleNewMessage
      },
      100
    );
  } else {
    room.user_is_a_member = false;
  }
}

function addRoomToList(room) {
  var $a = $('<a>', {
    'data-roomid': room.id,
    href: '#',
    class:
      'single-room list-group-item list-group-item-action flex-column align-items-start'
  });
  var $div = $('<div>', { class: 'd-flex w-100 justify-content-between' });
  var $h5 = $('<h5>', { class: 'mb-1', html: room.name });
  var $small = $('<small>', { html: room.isPrivate ? 'Private' : 'Public' });
  var $p = $('<p>', {
    class: 'mb-1',
    html: room.user_is_a_member ? 'Member' : 'Not a member - Click to join'
  });
  $a.click(loadChatRoom);
  $div.append($h5).append($small);
  $a.append($div).append($p);
  $('#rooms-list').append($a);
}

$('#createNewRoomBtn').on('click', event => {
  $(this).attr('disabled');
  var room_name = $('#roomNameInput').val();
  var is_private = $('#isPrivateCheck').is(':checked') ? true : false;
  createChatRoom(room_name, is_private);
  $('#createRoomModal').modal('hide');
});

function createChatRoom(room_name, private = false) {
  var options = {
    name: room_name,
    private: private
  };
  user.createRoom(
    options,
    room => {
      var room_type = private == true ? 'private' : 'public';
      var message = `Created ${room_type} room called ${room.name}`;
      alert(message);
      rooms.push(room);
      addRoomToList(room);
      selected_room = room;
      // If it's public, we need to manually join the group
      if (!private) {
        joinRoom(selected_room, false);
      }
      // Subscribe user to Room
      subscribeUserToRoom(room);
    },
    error => {
      console.log(`Error creating room ${error}`);
    }
  );
}
$('#joinRoomBtn').on('click', event => {
  joinRoom(selected_room, true);
  $('#joinRoomModal').modal('hide');
});
function joinRoom(room, load_messages = false) {
  user.joinRoom(
    room.id,
    room => {
      alert(`Joined room: "${room.name}"`);
      if (load_messages) {
        loadRoomMessages(room, messages => subscribeUserToRoom(room));
      }
    },
    error => {
      alert(`Error joining room ${room.name}`);
      console.log(`Error joining room ${room.name}: ${error}`);
    }
  );
}

function loadChatRoom(event) {
  var roomid = $(this).data('roomid');
  // Find Chat room from array
  selected_room = rooms.find(room => room.id == roomid);
  if (!selected_room) {
    alert('You selected an Unavailable Room');
    return;
  }
  if (!selected_room.user_is_a_member) {
    // Ask user to join
    $('#joinRoomModal').modal('show');
    return;
  }
  loadRoomMessages(selected_room);
  $('#group-name').text(selected_room.name);
}

function loadRoomMessages(room, cb = null) {
  user.fetchMessagesFromRoom(
    room,
    {
      limit: 20
    },
    messages => {
      room.messages = messages ? messages : [];
      // Clear Existing
      $('#messages-list').html('');
      room.messages.forEach(message => {
        // Push Messages to view
        addMessageToCurrentRoomView(message);
      });
      updateScroll();
      $('#message-input-group').removeClass('hide');
      if (cb) {
        cb(null, messages);
      }
    },
    error => {
      console.log(`Error fetching messages from ${room.name}: ${error}`);
    }
  );
}

function addMessageToCurrentRoomView(message) {
  var userIsSender = message.sender.id == user.id ? true : false;
  var card_div_class = `card message ${
    userIsSender ? 'message-sent' : 'message-recieved'
  }`;

  var $card_div = $('<div>', { class: card_div_class });
  var $card_body_div = $('<div>', { class: 'card-body' });
  var $img = $('<img>', {
    src: message.sender.avatarURL
      ? message.sender.avatarURL
      : '/profile-picture.png',
    class: 'rounded float-right',
    alt: 'Image'
  });
  var $h6 = $('<h6>', {
    class: 'card-subtitle mb-2 text-muted',
    html: message.sender.name
  });
  var $p = $('<p>', { html: message.text });
  $card_body_div
    .append($img)
    .append($h6)
    .append($p);
  $card_div.append($card_body_div);
  $('#messages-list').append($card_div);
}

/**
 * Scrolls to the bottom of the Messages div
 */
function updateScroll() {
  var chat = document.getElementById('messages-list');
  chat.scrollTop = chat.scrollHeight;
}

$('#sendMessageBtn').on('click', event => {
  var message = $('#messageInputText').val();
  sendMessage(message);
  $('#messageInputText').val('');
});

function sendMessage(text) {
  user.sendMessage(
    {
      text: text,
      roomId: selected_room.id
    },
    messageId => {
      console.log(`Added message to ${selected_room.name}`);
    },
    error => {
      console.log(`Error adding message to ${selected_room.name}: ${error}`);
    }
  );
}

function handleNewMessage(message) {
  // Push message to the appropriate room
  rm = rooms.find(room => room.id == message.room.id);
  if (rm.messages) {
    rm.messages.push(message);
  } else {
    rm.messages = [message];
  }
  // If the user is currently in that room, push it to the view
  if (selected_room && selected_room.id == message.room.id) {
    addMessageToCurrentRoomView(message);
    updateScroll();
  }
}
