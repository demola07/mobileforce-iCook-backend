const User = require('../../Models/authModel');
const Dish = require('../../Models/dishModel');
const uploadImage = require('../../Database/uploadImage');
const Profile = require("../../Models/profileModel");


exports.get_all_users = async (req, res, next) => {
  try {
    // const users = await User.find().populate('profile').select('_id method local.email');
    const users = await Profile.find().populate('dishes');
    res.status(200).json({
      status: 'success',
      error: '',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      error: err.message,
    });
  }
};

exports.get_user_by_id = async (req, res, next) => {
  try {
    const userId = req.params.id; 
    const user = await Profile.findOne({userId}).populate('dishes');
    const _user = Object.assign({}, {
      ...user.toJSON(),
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      dishesCount: user.dishes ? user.dishes.length : 0,
      isFollowing: user._isFollowing(userId)
    });
    delete _user.followers;
    delete _user.following;
    delete _user.favourites;
    delete _user.favDishes;

    if(user){
      res.status(200).json({
        status: 'success',
        error: '',
        results: user.length,
        data: {
          user: _user,
        }
      })
    } else{
      throw new Error('Not found');
    }
  } catch (err) {
    return res.status(404).json({
      status: 'fail',
      error: `user with ID ${req.params.id} not found`,
    });
  }
};


// /api/users/id/followers/:id - get
exports.get_followers = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
      throw new Error('Not found');
    }

    const followers = user.followers;

    res.status(200).json({
      status: success,
      count: followers.length,
      data: followers,
      error: '',
    });
  } catch (err) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found',
    });
  }
};

// /api/users/following/:id - get
exports.get_following = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
      throw new Error('Not found');
    }

    const following = user.following;

    res.status(200).json({
      status: success,
      count: following.length,
      data: following,
      error: '',
    });
  } catch (err) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found',
    });
  }
};

// /api/users/follow/:id - put
exports.followUser = async (req, res, next) => {
  try {
    const followId = req.params.id;
    const id = req.user._id.toString();
    if (id === followId) {
      throw new Error('You cant follow your self');
    }

    const user = await User.findById(id);
    const following = user.following || [];

    const isMatch = following.some((fol) => fol == followId);

    if (isMatch) {
      // idempotent mutation
      return res.status(200).json({
        status: 'fail',
        message: `You are already following user with ID ${followId}`,
      });
    }

    await User.findByIdAndUpdate(
      followId,
      {
        $push: { followers: id },
      },
      { new: true }
    );

    await User.findByIdAndUpdate(
      id,
      {
        $push: { following: followId },
      },
      { new: true }
    );

    res.status(200).json({
      status: success,
      message: `You have successfully followed user with ID ${followId} `,
      error: '',
    });
  } catch (err) {
    return res.status(400).json({ status: 'fail', error: err.message });
  }
};

// /api/users/unfollow/:id - put
exports.unfollowUser = async (req, res, next) => {
  try {
    const unfollowId = req.params.id;
    const id = req.user._id.toString();
    
    if (id === unfollowId) {
      throw new Error('You cant unfollow your self');
    }

    const user = await User.findById(id);
    const following = user.following || [];

    const isMatch = following.find((fol) => fol == unfollowId);

    if (!isMatch) {
      // idempotent mutation
      return res.status(200).json({
        status: 'fail',
        message: `You have already unfollowed user with ID ${unfollowId}`,
      });
    }

    await User.findByIdAndUpdate(
      unfollowId,
      {
        $pull: { followers: id },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      id,
      {
        $pull: { following: unfollowId },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `You have successfully unfollowed user with ID ${unfollowId} `,
      error: '',
    });
  } catch (err) {
    return res.status(400).json({ status: 'fail', error: err.message });
  }
};
